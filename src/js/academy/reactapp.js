console.log('the app is loaded');
import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';
import ConfirmationDialog from './components/ConfirmationDialog';



/**
 * Renders a single tA article
 * @param props
 * @returns
 * @constructor
 */
function Article(props) {
    return (
        <div>
            This is an article
        </div>
    );
}

/**
 * Renders a list of tA articles
 * @param articles
 * @returns
 * @constructor
 */
function ArticleList({articles}) {
    return (
        <div id="articles">
            {articles.map((a, i) => (
                <Article {...a} key={i}/>
            ))}
        </div>
    );
}

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
function TranslationAcademyApp() {
    const [lang, setLang] = useState(null);

    function handleSelectTranslation(lang) {
        console.log('selected translation', lang);
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

    // monitor translation validity
    useEffect(() => {
        // TODO: check if translation exists.
        console.log('TODO: check if the translation exists');
        const exists = true;
        if (!exists) {
            setLang(null);
        }
    }, [lang]);

    if (lang) {
        // TODO: render tA translation
        return <ArticleList articles={[1, 2, 3]}/>;
    } else {
        // TODO: pick a translation
        // return 'hello';
        return <ConfirmationDialog open={true}
                                   onClose={handleSelectTranslation}/>;
    }
}

ReactDOM.render(<TranslationAcademyApp/>, document.getElementById('react-app'));
