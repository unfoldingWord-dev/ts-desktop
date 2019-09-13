import React, {useState, useEffect} from 'react';
import ChooseTranslationDialog from './ChooseTranslationDialog';
import Articles from './Articles';
import PropTypes from 'prop-types';
import axios from 'axios';
import ConfirmDownloadDialog from './ConfirmDownloadDialog';
import fs from 'fs';

const catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';

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
        const dest = `/home/joel/Downloads/tA-${translation.language}.zip`;

        axios.get(translation.url, {
            responseType: 'blob'
        }).then(response => {

            console.log(response);

            var fileReader = new FileReader();
            fileReader.onload = function() {
                fs.writeFileSync(dest,
                    Buffer.from(new Uint8Array(this.result)));
            };
            fileReader.readAsArrayBuffer(response.data);

            // TODO: extract file

            console.log('download finished', dest);
            // TODO: write data to dest
            setConfirmDownload(false);
        }).catch(error => {
            // TODO: show error to user
            // TODO: clean up dest
            setTranslation(null);
            console.log(error);
        });

        // try {
        //     console.log('downloading translation', translation);
        //     const dest = `/home/joel/Downloads/tA-${translation.language}.zip`;
        //
        //     const writer = fs.createWriteStream(dest);
        //
        //     const response = await axios.get(translation.url, {
        //         responseType: 'stream',
        //         onDownloadProgress: progressEvent => {
        //         }
        //     });
        //
        //     response.data.pipe(writer);
        //
        //     await new Promise((resolve, reject) => {
        //         writer.on('finish', resolve);
        //         writer.on('error', reject);
        //     });
        //
        //     console.log('Download finished!');
        //     setConfirmDownload(false);
        //
        // } catch(error) {
        //     // TODO: show error to user
        //     // TODO: clean up dest
        //     setTranslation(null);
        //     console.log(error);
        // }

        // .then(response => {
        //     response.data.pipe(writer);
        //     console.log('Download finished!');
        //     setConfirmDownload(false);
        // }).catch(error => {
        //     // TODO: show error to user
        //     // TODO: clean up dest
        //     setTranslation(null);
        //     console.log(error);
        // });
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

                // TODO: check if it's been downloaded
                // TODO: check if it's out of date.

                return {
                    title: d.title,
                    direction: d.direction,
                    language: d.language,
                    update: true,
                    downloaded: false,
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
