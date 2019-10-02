import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';
import {ipcRenderer, shell} from 'electron';
import Academy from './components/Academy';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import lightBlue from '@material-ui/core/colors/lightBlue';

const theme = createMuiTheme({
    palette: {
        primary: lightBlue,
        secondary: {
            main: '#00796B'
        },
    },
});

/**
 * Binds the translationAcademy app to the window and proxies messages from
 * the main thread.
 */
function TranslationAcademyApp() {
    const [props, setProps] = useState({});

    // closes the academy app
    function handleClose() {
        ipcRenderer.sendSync('academy-window', 'close');
    }

    // modifies the prop list
    function handleChangeProp(newProps) {
        setProps({
            ...props,
            ...newProps
        });
    }

    // listen for props from the main thread
    useEffect(() => {
        function handlePropsChange(event, props) {
            setProps(props);
        }

        ipcRenderer.on('props', handlePropsChange);

        return () => {
            ipcRenderer.removeListener('props', handlePropsChange);
        };
    }, []);

    function handleOpenLink(href) {
        shell.openExternal(href);
    }

    return (
        <ThemeProvider theme={theme}>
            <Academy {...props} onClose={handleClose} onOpenLink={handleOpenLink} onChangeProp={handleChangeProp}/>
        </ThemeProvider>
    );
}

ReactDOM.render(<TranslationAcademyApp/>, document.getElementById('react-app'));
