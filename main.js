const {dialog, app, BrowserWindow, ipcMain} = require(
    'electron');
const path = require('path');

const debug = /--debug/.test(process.argv[2]);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let splashScreen;
let mainWindow = null;
let academyWindow;
let scrollToId;

function initialize() {
    makeSingleInstance();

    app.setPath('userData', (function(dataDir) {
        var base = process.env.LOCALAPPDATA ||
            (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Application Support') : path.join(process.env.HOME, '.config'));

        return path.join(base, dataDir);
    })('translationstudio'));

    app.on('ready', () => {
        createSplashWindow();
        setTimeout(() => {
            splashScreen.show();
            createWindow();
        }, 500);
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });

    ipcMain.on('loading-status', function(event, status) {
        splashScreen && splashScreen.webContents.send('loading-status', status);
    });

    ipcMain.on('main-window', function(event, arg) {
        if (typeof mainWindow[arg] === 'function') {
            let ret = mainWindow[arg]();
            event.returnValue = !!ret;
        } else if (mainWindow[arg]) {
            event.returnValue = mainWindow[arg];
        } else {
            event.returnValue = null;
        }
    });

    ipcMain.on('main-loading-done', function() {
        if (splashScreen && mainWindow) {
            // Launch fullscreen with DevTools open
            if (debug) {
                mainWindow.webContents.openDevTools();
                mainWindow.maximize();
                require('devtron').install();
            } else {
                mainWindow.show();
            }

            splashScreen.close();
        }
    });

    ipcMain.on('academy-window', function(event, arg) {
        if (typeof academyWindow[arg] === 'function') {
            let ret = academyWindow[arg]();
            event.returnValue = !!ret;
        } else if (academyWindow[arg]) {
            event.returnValue = academyWindow[arg];
        } else {
            event.returnValue = null;
        }
    });

    ipcMain.on('open-academy', function(event, id) {
        scrollToId = id;
        if (academyWindow) {
            academyWindow.show();
            scrollAcademyWindow();
        } else {
            createAcademySplash();
            setTimeout(function() {
                splashScreen.show();
                createAcademyWindow();
            }, 500);
        }
    });

    ipcMain.on('fire-reload', function() {
        if (splashScreen) {
            splashScreen.show();
        } else {
            createReloadSplash();
        }
        setTimeout(function() {
            splashScreen.show();
            setTimeout(function() {
                if (mainWindow) {
                    mainWindow.hide();
                    mainWindow.reload();
                }
            }, 500);
        }, 500);
    });

    ipcMain.on('save-as', function(event, arg) {
        var input = dialog.showSaveDialog(mainWindow, arg.options);
        event.returnValue = input || false;
    });

    ipcMain.on('open-file', function(event, arg) {
        var input = dialog.showOpenDialog(mainWindow, arg.options);
        event.returnValue = input || false;
    });

    ipcMain.on('ta-loading-done', function() {
        if (splashScreen && academyWindow) {
            academyWindow.show();
            splashScreen.close();
            scrollAcademyWindow();
        }
    });
}

function createWindow() {
    const windowOptions = {
        width: 980,
        minWidth: 980,
        height: 580,
        minHeight: 580,
        show: false,
        center: true,
        backgroundColor: '#00796B',
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        },
        title: app.getName(),
        icon: path.join(__dirname, '/icons/icon.png')
    };

    mainWindow = new BrowserWindow(windowOptions);
    mainWindow.dataPath = app.getPath('userData');
    mainWindow.loadURL(
        path.join('file://', __dirname, '/src/views/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.on('maximize', function() {
        mainWindow.webContents.send('maximize');
    });

    mainWindow.on('unmaximize', function() {
        mainWindow.webContents.send('unmaximize');
    });
}

function createSplashWindow() {
    const windowOptions = {
        width: 400,
        height: 170,
        resizable: false,
        autoHideMenuBar: true,
        frame: false,
        show: false,
        center: true,
        title: 'translationStudio'
    };
    splashScreen = new BrowserWindow(windowOptions);
    splashScreen.loadURL(
        'file://' + __dirname + '/src/views/splash-screen.html');

    splashScreen.on('closed', function() {
        splashScreen = null;
    });
}

/**
 * Make this app a single instance app.
 *
 * The main window will be restored and focused instead of a second window
 * opened when a person attempts to launch a second instance.
 *
 * Returns true if the current version of the app should quit instead of
 * launching.
 */
function makeSingleInstance() {
    if (process.mas) {
        return;
    }

    app.requestSingleInstanceLock();

    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });
}

function createAcademySplash() {
    splashScreen = new BrowserWindow({
        width: 400,
        height: 170,
        resizable: false,
        autoHideMenuBar: true,
        frame: false,
        center: true,
        show: false,
        title: 'translationStudio'
    });

    splashScreen.loadURL(
        'file://' + path.join(__dirname, '/src/views/academy-screen.html'));

    splashScreen.on('closed', function() {
        splashScreen = null;
    });
}

function createReloadSplash() {
    splashScreen = new BrowserWindow({
        width: 400,
        height: 170,
        resizable: false,
        autoHideMenuBar: true,
        frame: false,
        center: true,
        show: false,
        title: 'translationStudio'
    });

    splashScreen.loadURL(
        'file://' + __dirname + '/../views/reload-screen.html');

    splashScreen.on('closed', function() {
        splashScreen = null;
    });
}

function createAcademyWindow() {

    academyWindow = new BrowserWindow({
        width: 950,
        height: 660,
        minWidth: 950,
        minHeight: 580,
        useContentSize: true,
        center: true,
        title: app.getName(),
        backgroundColor: '#00796B',
        autoHideMenuBar: true,
        show: false,
        frame: false
    });

    academyWindow.loadURL('file://' + __dirname + '/../views/academy.html');

    academyWindow.on('closed', function() {
        academyWindow = null;
    });

    academyWindow.on('maximize', function() {
        academyWindow.webContents.send('maximize');
    });

    academyWindow.on('unmaximize', function() {
        academyWindow.webContents.send('unmaximize');
    });
}

function scrollAcademyWindow() {
    if (scrollToId) {
        academyWindow.webContents.send('academy-scroll', scrollToId);
    }
}

initialize();
