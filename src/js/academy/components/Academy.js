import React, {useState, useEffect} from 'react';
import ChooseTranslationDialog from './ChooseTranslationDialog';
import Articles from './Articles';
import PropTypes from 'prop-types';
import axios from 'axios';

const catalogUrl = 'https://api.door43.org/v3/subjects/Translation_Academy.json';

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
export default function Academy(props) {
    const {lang: translationLang, onClose, articleId} = props;

    const [lang, setLang] = useState(translationLang);
    const [articles, setArticles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    // TODO: have state for confirming the type of download. update, or fresh download.

    function handleSelectTranslation(lang) {
        if (lang === null) {
            onClose();
        } else {
            setLang(lang);
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
        setLang(translationLang);

        // TODO: scroll article into view
    }, [translationLang, articleId]);

    // monitor translation validity and load articles
    useEffect(() => {
        const translation = catalog.filter(t => t.language === lang)[0];

        if(!translation) {
            setLang(null);
            setArticles([]);
            return;
        }

        if (!translation.downloaded) {
            // TODO: confirm download
            setLang(null);
            setArticles([]);
        } else {
            if(translation.update) {
                // TODO: ask if they would like to download the update
            }
            // TODO: load the articles
            setArticles([1, 2, 3]);
        }
        console.log(translation);
    }, [lang]);
    return (
        <>
            <Articles articles={articles}/>
            <ChooseTranslationDialog open={!lang}
                                     options={catalog}
                                     onUpdate={handleCheckForUpdate}
                                     onClose={handleSelectTranslation}/>
        </>
    );
}

Academy.propTypes = {
    onClose: PropTypes.func.isRequired,
    lang: PropTypes.string,
    articleId: PropTypes.string
};
