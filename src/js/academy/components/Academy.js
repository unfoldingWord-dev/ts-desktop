import React, {useEffect, useState} from 'react';
import ChooseTranslationDialog from './ChooseTranslationDialog';
import Articles from './Articles';
import PropTypes from 'prop-types';
import axios from 'axios';
import ConfirmDownloadDialog from './ConfirmDownloadDialog';
import fs from 'fs';
import path from 'path';
import SimpleCache, {LOCAL_STORAGE} from '../SimpleCache';
import AdmZip from 'adm-zip';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import ConfirmRemoteLinkDialog from './ConfirmRemoteLinkDialog';
import TranslationReader from '../TranslationReader';
import semver from 'semver';
import {compareAsc} from 'date-fns';
import LoadingDialog from "./LoadingDialog";
import ErrorDialog from "./ErrorDialog";

const catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';

const cache = new SimpleCache(LOCAL_STORAGE);

const TA_CACHE_KEY = 'ta-cache';

function saveBlob(blob, dest) {
    return new Promise((resolve, reject) => {
        var fileReader = new FileReader();
        fileReader.onload = function () {
            try {
                const buffer = Buffer.from(new Uint8Array(this.result));
                fs.writeFileSync(dest, buffer);
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        fileReader.onerror = event => {
            fileReader.abort();
            reject(event);
        };
        fileReader.readAsArrayBuffer(blob);
    });
}

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
export default function Academy(props) {
    const {lang: initialLang, onClose, articleId, dataPath, onOpenLink} = props;
    const [lang, setLang] = useState(initialLang);
    const [articles, setArticles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [confirmDownload, setConfirmDownload] = useState(false);
    const [translation, setTranslation] = useState(null);
    const [confirmLink, setConfirmLink] = useState(false);
    const [clickedLink, setClickedLink] = useState(null);
    const [loadingCatalog, setLoadingCatalog] = useState(true);
    const [loading, setLoading] = useState({});
    const [errorMessage, setError] = useState(null);

    const {loadingTitle, loadingMessage, progress: loadingProgress} = loading;

    function handleCancelDownload() {
        setConfirmDownload(false);

        // close the aborted download
        if (!translation.downloaded) {
            if(translation.language !== 'en') {
                // fall back to english
                setLang('en');
            } else {
                setTranslation(null);
            }
        }
    }

    function getTranslationPath(translation) {
        return path.join(dataPath,
            `translationAcademy/${translation.language}/${translation.language}_ta`);
    }

    function isTranslationDownloaded(translation) {
        return fs.existsSync(getTranslationPath(translation));
    }

    function isTranslationOutdated(translation) {
        if (!translation.downloaded) {
            return false;
        }

        try {
            const reader = new TranslationReader(
                getTranslationPath(translation));
            const manifest = reader.readManifest();

            // check version
            const localVersion = semver.coerce(manifest.dublin_core.version);
            const remoteVersion = semver.coerce(translation.version);
            if (semver.gt(remoteVersion, localVersion)) {
                return true;
            }

            // check modified
            const localModified = manifest.dublin_core.modified;
            const remoteModified = translation.modified;
            return compareAsc(new Date(remoteModified),
                new Date(localModified)) > 0;
        } catch (error) {
            console.error('Invalid translation', translation, error);
            return true;
        }
    }

    /**
     * Utility to set the proper loading status for the translation download.
     * @param translation
     * @param progress
     */
    function setDownloadingTranslation(translation, progress) {
        const {update, title, language} = translation;

        let loadingTitle = 'Downloading';
        if(update) {
            loadingTitle = 'Updating';
        }
        setLoading({
            loadingTitle,
            loadingMessage: `${loadingTitle} ${title} (${language}) translationAcademy. Please wait.`,
            progress
        });
    }

    async function handleConfirmDownload() {
        setConfirmDownload(false);
        setDownloadingTranslation(translation, 0);
        const extractDest = path.join(dataPath,
            `translationAcademy/${translation.language}`);
        const dest = `${extractDest}.zip`;
        mkdirp.sync(extractDest);

        axios.get(translation.url, {
            responseType: 'blob',
            onDownloadProgress: progressEvent => {
                if (progressEvent.lengthComputable) {
                    const progress = progressEvent.loaded / progressEvent.total;
                    setDownloadingTranslation(translation, progress);
                }
            }
        }).then(response => {
            // write data to file
            return saveBlob(response.data, dest).then(() => {
                try {
                    const zip = new AdmZip(dest);
                    zip.extractAllTo(extractDest, true);
                    rimraf.sync(dest);
                    return Promise.resolve();
                } catch (error) {
                    return Promise.reject(error);
                }
            });
        }).then(() => {
            // find images
            const reader = new TranslationReader(
                getTranslationPath(translation));
            const imageLinks = [];
            try {
                reader.listArticles(article => {
                    const result = article.body.match(/!\[]\(([^)]+)\)/g);
                    if (result) {
                        const links = result.map(img => {
                            return {
                                articlePath: article.path,
                                href: img.match(/!\[]\(([^)]+)\)/)[1]
                            };
                        });
                        imageLinks.push.apply(imageLinks, links);
                    }
                });
            } catch (error) {
                return Promise.reject(error);
            }

            return Promise.resolve(imageLinks);
        }).then(async links => {
            for (let i = 0, len = links.length; i < len; i++) {
                const link = links[i];
                const response = await axios.get(link.href, {
                    responseType: 'blob'
                });
                const cacheDir = path.join(link.articlePath, '.cache');
                await mkdirp(cacheDir);
                const imageDest = path.join(cacheDir,
                    `${path.basename(link.href)}`);
                await saveBlob(response.data, imageDest);
            }
        }).then(() => {
            // update translation
            const updatedTranslation = {
                ...translation,
                downloaded: true,
                update: false
            };

            // TODO: update catalog as well so that ctr+o will display an updated dialog
            //  this action is hidden from the UI though, so it won't be too common.
            setTranslation(updatedTranslation);

            // TRICKY: set loading to finished
            setDownloadingTranslation(translation, 1);

            // TRICKY: wait a moment to ensure minimum loading time
            setTimeout(() => {
                setLoading({});
            }, 1000);
        }).catch(error => {
            setError('Unable to download translationAcademy. Please try again.');
            setLoading({});
            setConfirmDownload(false);

            rimraf.sync(dest);
            rimraf.sync(extractDest);

            setTranslation(null);
            console.error(error);
        });
    }

    function handleSelectTranslation(newTranslation) {
        if (newTranslation === null) {
            onClose();
        } else {
            setTranslation(newTranslation);
        }
    }

    function handleCheckForUpdate() {
        setLoading({
            loadingTitle: 'Updating',
            loadingMessage: 'Looking for updates to translationAcademy. Please wait.',
            progress: 0
        });
        axios.get(catalogUrl).then(response => {
            const resources = response.data.map(d => {
                // filter down to the first valid resource container
                try {
                    const format = d.resources[0].formats.filter(f => {
                        return f.format.includes('application/zip;') &&
                            f.format.includes('type=man') &&
                            f.format.includes('conformsto=rc0.2');
                    })[0];

                    const trans = {
                        title: d.title,
                        direction: d.direction,
                        language: d.language,
                        url: format.url,
                        size: format.size,
                        // TRICKY: there seems to be a bug in the api because it does not have the correct modified date in the format.
                        //  I think the api is using the real modified date from the commit, while the modified date in the manifest is manually updated and can become stale.
                        modified: d.resources[0].modified, // format.modified,
                        version: d.resources[0].version,
                        downloaded: isTranslationDownloaded(d)
                    };

                    return {
                        ...trans,
                        update: isTranslationOutdated(trans)
                    };

                } catch (error) {
                    console.error('The resource is invalid', error, d);
                    return {};
                }
            }).filter(r => !!r.url);
            setCatalog(resources);

            // TRICKY: set loading to finished
            setLoading({
                loadingTitle: 'Updating',
                loadingMessage: 'Looking for updates to translationAcademy. Please wait.',
                progress: 1
            });

            // TRICKY: wait a moment to ensure minimum loading time
            setTimeout(() => {
                setLoading({});
            }, 1000);
        }).catch(error => {
            setLoading({});
            setError('Unable to check for updates. Please try again.');
            console.error(error);
        });
    }

    // get the language updates.
    useEffect(() => {
        setLang(initialLang);
    }, [initialLang]);

    // listen to keyboard
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.ctrlKey && event.key === 'o') {
                setLang(null);
                setTranslation(null);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // keep catalog cached
    useEffect(() => {
        if (catalog && catalog.length) {
            cache.set(TA_CACHE_KEY, JSON.stringify(catalog));
        }
    }, [catalog]);

    // load cached catalog
    useEffect(() => {
        function getCachedCatalog() {
            let cachedCatalog = cache.get(TA_CACHE_KEY);
            if (cachedCatalog) {
                try {
                    return JSON.parse(cachedCatalog);
                } catch (error) {
                    console.error('Cached tA catalog was corrupt', error);
                }
            }
            return [];
        }

        // TRICKY: we need the dataPath to check if things are downloaded
        if (dataPath) {
            setLoadingCatalog(true);
            const catalog = getCachedCatalog();
            // TRICKY: re-check available resources in case something changed offline.
            catalog.map(r => {
                r.downloaded = isTranslationDownloaded(r);
                // TRICKY: check if outdated after checking if downloaded.
                r.update = isTranslationOutdated(r);
            });
            setCatalog(catalog);
        }
        setLoadingCatalog(false);
    }, [dataPath]);

    // load correct translation
    useEffect(() => {
        const filtered = catalog.filter(t => t.language === lang);
        if (filtered.length > 0) {
            setTranslation(filtered[0]);
        } else {
            setTranslation(null);
        }
    }, [lang, catalog]);

    // scroll to article
    useEffect(() => {
        handleScroll(articleId);
    }, [articleId, articles]);

    // monitor translation validity and load articles
    useEffect(() => {

        // no translation
        if (!translation || !translation.downloaded) {
            setArticles([]);
        }

        // download available
        if (translation && (!translation.downloaded || translation.update)) {
            setConfirmDownload(true);
        } else {
            setConfirmDownload(false);
        }

        // content available
        if (translation && translation.downloaded) {
            const reader = new TranslationReader(
                getTranslationPath(translation));
            try {
                setArticles(reader.listArticles());
            } catch (error) {
                console.error('The translation is corrupt', error);
                const dir = getTranslationPath(translation);
                rimraf.sync(dir);
                setError('The translation is corrupt. Please try again.');
                setTranslation(null);
            }
        }
    }, [translation]);

    function handleClickLink(link) {
        if (link.articleId) {
            handleScroll(link.articleId);
        } else if (link.href) {
            setClickedLink(link.href);
            setConfirmLink(true);
        }
    }

    function handleScroll(articleId) {
        const element = document.getElementById(articleId);
        if (element) {
            element.scrollIntoView();
        }
    }

    function handleConfirmLink() {
        onOpenLink(clickedLink);
        setConfirmLink(false);
    }

    function handleCancelLink() {
        setConfirmLink(false);
    }

    function handleDismissError() {
        setError(null);
    }

    return (
        <>
            <Articles articles={articles} onClickLink={handleClickLink}/>
            <ChooseTranslationDialog open={!translation && !loadingCatalog}
                                     options={catalog}
                                     initialValue={lang}
                                     onUpdate={handleCheckForUpdate}
                                     onClose={handleSelectTranslation}/>
            <ConfirmDownloadDialog
                translation={translation}
                open={confirmDownload}
                onCancel={handleCancelDownload}
                onOk={handleConfirmDownload}/>
            <ConfirmRemoteLinkDialog href={clickedLink}
                                     open={confirmLink}
                                     onCancel={handleCancelLink}
                                     onOk={handleConfirmLink}/>
            <LoadingDialog open={!!loadingTitle} title={loadingTitle} message={loadingMessage}
                           progress={loadingProgress}/>
            <ErrorDialog title="Error" message={errorMessage} open={errorMessage !== null} onClose={handleDismissError}/>
        </>
    );
}

Academy.propTypes = {
    onClose: PropTypes.func.isRequired,
    lang: PropTypes.string,
    articleId: PropTypes.string,
    onOpenLink: PropTypes.func.isRequired
};
