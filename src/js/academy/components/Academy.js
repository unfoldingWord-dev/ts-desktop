import React, {useState, useEffect} from 'react';
import ChooseTranslationDialog from './ChooseTranslationDialog';
import Articles from './Articles';
import PropTypes from 'prop-types';
import axios from 'axios';
import ConfirmationDialog from './ConfirmationDialog';
import ConfirmDownloadDialog from './ConfirmDownloadDialog';

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

    function handleConfirmDownload() {
        // TODO: start downloading
        console.log('download stuff');
    }

    function handleSelectTranslation(newTranslation) {
        console.log('selected translation', newTranslation);
        if (newTranslation === null) {
            onClose();
        } else {
            setTranslation(newTranslation);
        }
    }

    function handleCheckForUpdate() {
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
        console.log('selected translation', translation);

        if (!translation) {
            // reset everything if the translation is invalid
            setArticles([]);
        } else if (!translation.downloaded) {
            setArticles([]);
            // ask user if they would like to download
            setConfirmDownload(true);
        } else {
            if (translation.update) {
                // ask user if they would like the update
                setConfirmDownload(true);
            }
            // TODO: load the articles
            setArticles([1, 2, 3]);
        }
    }, [translation]);

    // TODO: provide dialog for confirming the download.
    // this should be told if this is an update or a download. The translation will know this.
    // TODO: unset the confirmation bit when the dialog is dismissed.

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
