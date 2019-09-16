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
import yaml from 'js-yaml';

const catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';

const cache = new SimpleCache(LOCAL_STORAGE);

const TA_CACHE_KEY = 'ta-cache';

function safeRead(filePath) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath);
    } else {
        return null;
    }
}

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
export default function Academy(props) {
    const {lang, onClose, articleId, dataPath} = props;
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

    function getTranslationPath(translation) {
        return path.join(dataPath,
            `translationAcademy/${translation.language}`);
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
            var fileReader = new FileReader();
            fileReader.onload = function() {
                const buffer = Buffer.from(new Uint8Array(this.result));
                fs.writeFileSync(dest, buffer);

                const zip = new AdmZip(dest);
                zip.extractAllTo(extractDest, true);
                rimraf.sync(dest);

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
            const dir = getTranslationPath(translation);
            try {
                const manifestPath = path.join(dir,
                    `${translation.language}_ta`,
                    'manifest.yaml');
                const manifest = yaml.load(manifestPath);
                const newArticles = [];
                console.log(manifest);
                manifest.projects.forEach(p => {
                    // load articles in each project
                    const projectPath = path.join(dir, p.path);
                    const tocPath = path.join(projectPath, 'toc.yaml');
                    const toc = yaml.load(tocPath);
                    // fall back to file list if toc does not exist
                    toc.sections.forEach(s => {
                        // load articles in each section
                        const articleDir = path.join(projectPath, s.link);
                        const articleTitle = safeRead(path.join(articleDir,
                            'title.md'));
                        const articleSubTitle = safeRead(path.join(articleDir,
                            'sub-title.md'));
                        const articleBody = safeRead(
                            path.join(articleDir, '01.md'));

                        newArticles.push({
                            title: articleTitle,
                            subTitle: articleSubTitle,
                            body: articleBody
                        });
                    });
                });

                setArticles(newArticles);
            } catch (error) {
                console.error(error);
                // TODO: the translation is corrupt. Delete it.
                // TODO: show error to user.
            }
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
