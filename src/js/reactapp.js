const React = require('react');
const ReactDOM = require('react-dom');
const e = React.createElement;
const ipcRenderer = require('electron').ipcRenderer;

// bind to electron events
ipcRenderer.on('props', function (event, props) {
    const {lang, articleId} = props;
    console.log('academy lang is ' + lang);
    // TODO: load correct translation or show selector.
    var element = document.getElementById(articleId);

    if (element) {
        element.scrollIntoView();
    }
});

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { liked: false };
    }

    render() {
        if (this.state.liked) {
            return 'You liked this.';
        }

        return e(
            'button',
            { onClick: () => this.setState({ liked: true }) },
            'Like'
        );
    }
}

ReactDOM.render(e(App), document.getElementById('react-app'));
