import React, {useState, useEffect} from 'react';
import ChooseTranslationDialog from './ChooseTranslationDialog';
import Articles from './Articles';
import PropTypes from 'prop-types';
import axios from 'axios';
import ConfirmDownloadDialog from './ConfirmDownloadDialog';
import fs from 'fs';
import SimpleCache, {LOCAL_STORAGE} from '../SimpleCache';
import AdmZip from 'adm-zip';

const catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';

const cache = new SimpleCache(LOCAL_STORAGE);

const TA_CACHE_KEY = 'ta-cache';

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
export default function Academy(props) {
    const {lang, onClose, articleId} = props;
    const [articles, setArticles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [confirmDownload, setConfirmDownload] = useState(false);
    const [translation, setTranslation] = useState(null);

    function handleCancelDownload() {
        setConfirmDownload(false);

        // close the aborted translation
        if (!translation.downloaded) {
            setTranslation(null);
        }
    }

    async function handleConfirmDownload() {
        // TODO: display loading dialog
        const dest = `/home/joel/Downloads/ta-${translation.language}.zip`;
        const extractDest = `/home/joel/Downloads/ta-${translation.language}`;

        axios.get(translation.url, {
            responseType: 'blob'
        }).then(response => {
            // write data to file
            var fileReader = new FileReader();
            fileReader.onload = function() {
                const buffer = Buffer.from(new Uint8Array(this.result));
                fs.writeFileSync(dest, buffer);

                const zip = new AdmZip(dest);
                zip.extractAllTo(extractDest, true);

                setConfirmDownload(false);

                // update translation
                setTranslation({
                    ...translation,
                    downloaded: true,
                    update: false
                });
                // TODO: update the catalog as well so it's saved in the cache and displayed in the ui the next time the dialog opens.
            };
            fileReader.readAsArrayBuffer(response.data);
        }).catch(error => {
            // TODO: show error to user
            // TODO: delete failed download
            setTranslation(null);
            console.log(error);
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

                const resourcePath = `/home/joel/Downloads/ta-${d.language}.zip`;

                // TODO: check if it's out of date.

                return {
                    title: d.title,
                    direction: d.direction,
                    language: d.language,
                    update: false,
                    downloaded: fs.existsSync(resourcePath),
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
        if(catalog && catalog.length) {
            cache.set(TA_CACHE_KEY, JSON.stringify(catalog));
        }
    }, [catalog]);

    // load cached catalog
    useEffect(() => {
        function getCachedCatalog() {
            let cachedCatalog = cache.get(TA_CACHE_KEY);
            if(cachedCatalog) {
                try {
                    return JSON.parse(cachedCatalog);
                } catch (error) {
                    console.error('Cached tA catalog was corrupt', error);
                }
            }
            return [];
        }

        const catalog = getCachedCatalog();
        catalog.map(r => {
            const resourcePath = `/home/joel/Downloads/ta-${r.language}.zip`;
            r.downloaded = fs.existsSync(resourcePath);
            // TODO: check if the resource is outdated.
            r.update = false;
        });
        setCatalog(catalog);
    }, []);

    // listen to prop changes
    useEffect(() => {
        // TODO: watching the translation and article should be in two separate effects.
        const newTranslation = catalog.filter(
            t => t.language === lang)[0];
        setTranslation(newTranslation);

        // TODO: scroll article into view
    }, [lang, articleId]);

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
            // TODO: load the articles
            setArticles([1, 2, 3]);
        }
    }, [translation]);

    return (
        <>
            <Articles articles={articles}/>
            <ChooseTranslationDialog open={!translation}
                                     options={catalog}
                                     onUpdate={handleCheckForUpdate}
                                     onClose={handleSelectTranslation}/>
            <ConfirmDownloadDialog
                translation={translation}
                open={confirmDownload}
                onCancel={handleCancelDownload}
                onOk={handleConfirmDownload}/>
        </>
    );
}

Academy.propTypes = {
    onClose: PropTypes.func.isRequired,
    lang: PropTypes.string,
    articleId: PropTypes.string
};
