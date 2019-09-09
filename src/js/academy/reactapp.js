import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';
import ChooseTranslationDialog from './components/ChooseTranslationDialog';
import Articles from './components/Articles';

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
function TranslationAcademyApp() {
    const [lang, setLang] = useState(null);
    const [articles, setArticles] = useState([]);

    function handleSelectTranslation(lang) {
        console.log('selected translation', lang);
        if(lang === null) {
            ipcRenderer.sendSync("academy-window", "close");
        } else {
            setLang(lang);
        }
    }

    // listen to prop changes
    useEffect(() => {
        function handlePropsChange(event, props) {
            const {lang: newLang, articleId} = props;
            if (newLang !== lang) {
                setLang(newLang);
            }

            var element = document.getElementById(articleId);
            if (element) {
                element.scrollIntoView();
            }
        }

        ipcRenderer.on('props', handlePropsChange);

        return () => {
            ipcRenderer.removeListener('props', handlePropsChange);
        };
    }, []);

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
                                     onClose={handleSelectTranslation}/>
        </>
    );
}

ReactDOM.render(<TranslationAcademyApp/>, document.getElementById('react-app'));
