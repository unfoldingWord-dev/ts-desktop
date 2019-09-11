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

    function handleSelectTranslation(lang) {
        if (lang === null) {
            onClose();
        } else {
            setLang(lang);
        }
    }

    function handleUpdate() {
        axios.get(catalogUrl).then(response => {
            setCatalog(response.data);
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
        // TODO: check if the translation exists.
        const exists = lang !== null;

        if (!exists) {
            setLang(null);
            setArticles([]);
        } else {
            // TODO: load the articles
            setArticles([1, 2, 3]);
        }
    }, [lang]);

    return (
        <>
            <Articles articles={articles}/>
            <ChooseTranslationDialog open={!lang}
                                     options={catalog}
                                     onUpdate={handleUpdate}
                                     onClose={handleSelectTranslation}/>
        </>
    );
}

Academy.propTypes = {
    onClose: PropTypes.func.isRequired,
    lang: PropTypes.string,
    articleId: PropTypes.string
};
