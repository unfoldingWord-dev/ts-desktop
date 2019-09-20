import React, {useState, useEffect} from 'react';
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

const catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';

const cache = new SimpleCache(LOCAL_STORAGE);

const TA_CACHE_KEY = 'ta-cache';

function saveBlob(blob, dest) {
    return new Promise((resolve, reject) => {
        var fileReader = new FileReader();
        fileReader.onload = function() {
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
    const {lang, onClose, articleId, dataPath, onOpenLink} = props;
    const [articles, setArticles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [confirmDownload, setConfirmDownload] = useState(false);
    const [translation, setTranslation] = useState(null);
    const [confirmLink, setConfirmLink] = useState(false);
    const [clickedLink, setClickedLink] = useState(null);

    function handleCancelDownload() {
        setConfirmDownload(false);

        // close the aborted translation
        if (!translation.downloaded) {
            setTranslation(null);
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
        const resourcePath = getTranslationPath(translation);
        // TODO: check if the translation is outdated
        return false;
    }

    async function handleConfirmDownload() {

        // TODO: display loading dialog
        const extractDest = path.join(dataPath,
            `translationAcademy/${translation.language}`);
        const dest = `${extractDest}.zip`;
        mkdirp.sync(extractDest);

        axios.get(translation.url, {
            responseType: 'blob'
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
                    const result = article.body.match(/!\[]\(([^)]*)\)/g);
                    if (result) {
                        const links = result.map(img => {
                            return {
                                articlePath: article.path,
                                href: img.match(/!\[]\(([^)]*)\)/)[1]
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
            // set state
            setConfirmDownload(false);

            // update translation
            setTranslation({
                ...translation,
                downloaded: true,
                update: false
            });
            // TODO: update the catalog as well so it's saved in the cache and displayed in the ui the next time the dialog opens.
        }).catch(error => {
            // TODO: show error to user
            // TODO: delete failed download
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
        // TODO: display loading dialog
        axios.get(catalogUrl).then(response => {
            const resources = response.data.map(d => {

                // filter down to the first valid resource container
                let format = {};
                try {
                    format = d.resources[0].formats.filter(f => {
                        return f.format.includes('application/zip;') &&
                            f.format.includes('type=man') &&
                            f.format.includes('conformsto=rc0.2');
                    })[0];
                } catch (error) {
                    console.error('The resource is invalid', error, d);
                }

                return {
                    title: d.title,
                    direction: d.direction,
                    language: d.language,
                    update: isTranslationOutdated(d),
                    downloaded: isTranslationDownloaded(d),
                    url: format.url,
                    size: format.size,
                    modified: format.modified
                };
            }).filter(r => !!r.url);
            setCatalog(resources);
        }).catch(error => {
            // TODO: show error to user
            setCatalog([]);
            console.log(error);
        });
    }

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
            const catalog = getCachedCatalog();
            // TRICKY: re-check available resources in case something changed offline.
            catalog.map(r => {
                r.downloaded = isTranslationDownloaded(r);
                r.update = isTranslationOutdated(r);
            });
            setCatalog(catalog);
        }
    }, [dataPath]);

    // listen to prop changes
    useEffect(() => {
        // TODO: watching the translation and article should be in two separate effects.
        const newTranslation = catalog.filter(
            t => t.language === lang)[0];
        setTranslation(newTranslation);
    }, [lang]);

    useEffect(() => {
        handleScroll(articleId);
    }, [articleId]);

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
                console.error(error);
                // TODO: the translation is corrupt. Delete it.
                // TODO: show error to user.
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

    return (
        <>
            <Articles articles={articles} onClickLink={handleClickLink}/>
            <ChooseTranslationDialog open={!translation}
                                     options={catalog}
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
        </>
    );
}

Academy.propTypes = {
    onClose: PropTypes.func.isRequired,
    lang: PropTypes.string,
    articleId: PropTypes.string,
    onOpenLink: PropTypes.func.isRequired
};
