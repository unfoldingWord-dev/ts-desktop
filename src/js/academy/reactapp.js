import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer} from 'electron';
import Academy from './components/Academy';

/**
 * Binds the translationAcademy app to the window and proxies messages from
 * the main thread.
 */
function TranslationAcademyApp() {
    const [lang, setLang] = useState(null);
    const [articleId, setArticleId] = useState(null);

    // closes the academy app
    function handleClose() {
        ipcRenderer.sendSync("academy-window", "close");
    }

    // listen for props from the main thread
    useEffect(() => {
        function handlePropsChange(event, props) {
            const {lang: newLang, articleId: newArticleId} = props;
            setLang(newLang);
            setArticleId(newArticleId);
        }

        ipcRenderer.on('props', handlePropsChange);

        return () => {
            ipcRenderer.removeListener('props', handlePropsChange);
        };
    }, []);


    return (
        <Academy lang={lang} articleId={articleId} onClose={handleClose}/>
    );
}

ReactDOM.render(<TranslationAcademyApp/>, document.getElementById('react-app'));
