const React = require('react');
const useState = require('react').useState;
const useEffect = require('react').useEffect;
const ReactDOM = require('react-dom');
const e = React.createElement;
const ipcRenderer = require('electron').ipcRenderer;

function App() {
    const [lang, setLang] = useState(null);

    // listen to prop changes
    useEffect(() => {
        function handlePropsChange(event, props) {
            const {lang: newLang, articleId} = props;
            if(newLang !== lang) {
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
        if(!exists) {
            setLang(null);
        }
    }, [lang]);

    if (lang) {
        // TODO: render tA translation
        return `You are viewing ${lang}`;
    } else {
        // TODO: pick a translation
        return `choose a translation`;
    }

    // return e(
    //     'button',
    //     {onClick: () => setLang('en')},
    //     'Choose a language'
    // );
}

ReactDOM.render(e(App), document.getElementById('react-app'));
