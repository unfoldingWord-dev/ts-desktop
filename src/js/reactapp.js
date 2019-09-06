const React = require('react');
const useState = require('react').useState;
const useEffect = require('react').useEffect;
const ReactDOM = require('react-dom');
const e = React.createElement;
const ipcRenderer = require('electron').ipcRenderer;

/**
 * Renders a single tA article
 * @param props
 * @returns
 * @constructor
 */
function Article(props) {
    return e(
        'div',
        {},
        'This is an article'
    );
}

/**
 * Renders a list of tA articles
 * @param articles
 * @returns
 * @constructor
 */
function ArticleList({articles}) {
    return e(
        'div',
        {
            id: 'articles'
        },
        articles.map((a, i) => e(Article, {...a, key: i}))
    );
}

/**
 * Renders the tA page
 * @returns
 * @constructor
 */
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
        return e(ArticleList, {articles: [1, 2, 3]});
    } else {
        // TODO: pick a translation
        return `choose a translation`;
    }
}

ReactDOM.render(e(App), document.getElementById('react-app'));
