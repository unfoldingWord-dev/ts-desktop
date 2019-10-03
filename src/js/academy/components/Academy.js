import React, {useEffect, useState} from 'react';
import ChooseTranslationDialog from './ChooseTranslationDialog';
import Articles from './Articles';
import PropTypes from 'prop-types';
import axios from 'axios';
import ConfirmDownloadDialog from './ConfirmDownloadDialog';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import ConfirmRemoteLinkDialog from './ConfirmRemoteLinkDialog';
import TranslationReader from '../TranslationReader';
import LoadingDialog from "./LoadingDialog";
import ErrorDialog from "./ErrorDialog";
import {useCatalog} from "../util";
import {ipcRenderer} from "electron";

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
    const {onClose, onOpenLink} = props;

    const [dataPath, setDataPath] = useState();
    const [lang, setLang] = useState();
    const [articleId, setArticleId] = useState();
    const {loading: loadingCatalog, catalog, updateCatalog, syncCatalog, ready: catalogIsReady} = useCatalog(dataPath);
    const [articles, setArticles] = useState([]);
    const [translation, setTranslation] = useState(null);

    const [confirmDownload, setConfirmDownload] = useState(false);
    const [confirmLink, setConfirmLink] = useState(false);
    const [clickedLink, setClickedLink] = useState(null);
    const [errorMessage, setError] = useState(null);
    const [loading, setLoading] = useState({});
    const {loadingTitle, loadingMessage, progress: loadingProgress} = loading;

    function handleCancelDownload() {
        setConfirmDownload(false);

        // close translation if not already downloaded
        if (!translation.downloaded) {
            setLang(null);
        }
    }

    function getTranslationPath(translation) {
        return path.join(dataPath, `translationAcademy/${translation.language}/${translation.language}_ta`);
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

            setLang(null);
            // setTranslation(null);
            console.error(error);
        });
    }

    function handleDeleteTranslation(selectedTranslation) {
        try {
            const dir = getTranslationPath(selectedTranslation);
            rimraf.sync(dir);
            syncCatalog();
        } catch (error) {
            console.error(`failed to delete ${selectedTranslation.language} translation`, error);
        }
    }

    function handleSelectTranslation(newTranslation) {
        if (newTranslation === null) {
            onClose();
        } else {
            setArticleId(null);
            setLang(newTranslation.language);
        }
    }

    async function handleCheckForUpdate() {
        setLoading({
            loadingTitle: 'Updating',
            loadingMessage: 'Looking for updates to translationAcademy. Please wait.',
            progress: 0
        });

        try {
            await updateCatalog();
        } catch (error) {
            setError('Unable to check for updates. Please try again.');
            console.error(error);
        } finally {
            setLoading({});
        }
    }

    // listen to events from main thread
    useEffect(() => {
        function handlePropsChange(event, props) {
            // TODO: reload stuff
            setDataPath(props.dataPath);
            setLang(props.lang);
            setArticleId(props.articleId);
        }

        ipcRenderer.on('props', handlePropsChange);

        return () => {
            ipcRenderer.removeListener('props', handlePropsChange);
        };
    }, []);

    // listen to keyboard
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.ctrlKey && event.key === 'o') {
                setLang(null);
                // setTranslation(null);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // update translation when the props change
    useEffect(() => {
        // TRICKY: scroll to the top so that new translations don't open in the middle.
        handleScroll('scroll-top');

        if (!catalogIsReady) {
            return;
        }

        const filtered = catalog.filter(t => t.language === lang);
        if (filtered.length > 0) {
            setTranslation(filtered[0]);
        } else {
            setTranslation(null);
        }
    }, [lang, catalogIsReady]);

    // scroll to article
    useEffect(() => {
        if(articles.length) {
            handleScroll(articleId);

            // clear this prop so subsequent link clicks trigger an update
            if(articleId !== null) {
                setArticleId(null);
            }
        }
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
                setLang(null);
                // setTranslation(null);
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

    function handleScroll(id) {
        const element = document.getElementById(id);
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

    const isChooseDialogOpen = !translation && !loadingCatalog;
    return (
        <>
            <Articles articles={articles} onClickLink={handleClickLink}/>
            <ChooseTranslationDialog open={isChooseDialogOpen}
                                     options={catalog}
                                     initialValue={isChooseDialogOpen ? lang : null}
                                     onUpdate={handleCheckForUpdate}
                                     onDelete={handleDeleteTranslation}
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
    onOpenLink: PropTypes.func.isRequired
};
