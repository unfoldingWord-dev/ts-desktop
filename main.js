const {Menu, dialog, app, BrowserWindow, ipcMain, ipcRenderer, remote} = require(
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

    app.on('ready', () => {
        // TODO: create menu
        // TODO: create splash
        createWindow();
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
}

function createWindow() {
    const windowOptions = {
        width: 1080,
        minWidth: 680,
        height: 840,
        webPreferences: {
            nodeIntegration: true
        },
        title: app.getName(),
        icon: path.join(__dirname, '/icons/icon.png')
    };

    mainWindow = new BrowserWindow(windowOptions);
    mainWindow.loadURL(path.join('file://', __dirname, '/src/views/index.html'));

    // Launch fullscreen with DevTools open
    if (debug) {
        mainWindow.webContents.openDevTools();
        mainWindow.maximize();
        require('devtron').install();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
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


function createMainSplash() {
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

    //splashScreen.webContents.openDevTools();

    splashScreen.loadURL(
        'file://' + __dirname + '/../views/splash-screen.html');

    splashScreen.on('closed', function() {
        splashScreen = null;
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

    //splashScreen.webContents.openDevTools();

    splashScreen.loadURL(
        'file://' + __dirname + '/../views/academy-screen.html');

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

    //splashScreen.webContents.openDevTools();

    splashScreen.loadURL(
        'file://' + __dirname + '/../views/reload-screen.html');

    splashScreen.on('closed', function() {
        splashScreen = null;
    });
}

function createMainWindow() {

    mainWindow = new BrowserWindow({
        width: 980,
        height: 580,
        minWidth: 980,
        minHeight: 580,
        useContentSize: true,
        center: true,
        title: 'translationStudio',
        backgroundColor: '#00796B',
        autoHideMenuBar: true,
        frame: false,
        show: false
    });

    mainWindow.dataPath = app.getPath('userData');

    // mainWindow.webContents.openDevTools();

    mainWindow.loadURL('file://' + __dirname + '/../views/index.html');

    mainWindow.on('closed', function() {
        mainWindow = null;
    });

    mainWindow.on('maximize', function() {
        mainWindow.webContents.send('maximize');
    });

    mainWindow.on('unmaximize', function() {
        mainWindow.webContents.send('unmaximize');
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

    //academyWindow.webContents.openDevTools();

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

function createAppMenus() {
    // Create the Application's main menu
    var template = [
        {
            label: 'Application',
            submenu: [
                {
                    label: 'About Application',
                    selector: 'orderFrontStandardAboutPanel:'
                },
                {type: 'separator'},
                {
                    label: 'Quit', accelerator: 'Command+Q', click: function() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    selector: 'redo:'
                },
                {type: 'separator'},
                {label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
                {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    selector: 'paste:'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    selector: 'selectAll:'
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'Shift+CmdOrCtrl+I',
                    click: function() {
                        var w = BrowserWindow.getFocusedWindow();
                        w && w.webContents.openDevTools();
                    }
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

//
// ipcMain.on('main-window', function(event, arg) {
//     if (typeof mainWindow[arg] === 'function') {
//         let ret = mainWindow[arg]();
//         event.returnValue = !!ret;
//     } else if (mainWindow[arg]) {
//         event.returnValue = mainWindow[arg];
//     } else {
//         event.returnValue = null;
//     }
// });
//
// ipcMain.on('academy-window', function(event, arg) {
//     if (typeof academyWindow[arg] === 'function') {
//         let ret = academyWindow[arg]();
//         event.returnValue = !!ret;
//     } else if (academyWindow[arg]) {
//         event.returnValue = academyWindow[arg];
//     } else {
//         event.returnValue = null;
//     }
// });
//
// ipcMain.on('open-academy', function(event, id) {
//     scrollToId = id;
//     if (academyWindow) {
//         academyWindow.show();
//         scrollAcademyWindow();
//     } else {
//         createAcademySplash();
//         setTimeout(function() {
//             splashScreen.show();
//             createAcademyWindow();
//         }, 500);
//     }
// });
//
// ipcMain.on('fire-reload', function() {
//     if (splashScreen) {
//         splashScreen.show();
//     } else {
//         createReloadSplash();
//     }
//     setTimeout(function() {
//         splashScreen.show();
//         setTimeout(function() {
//             if (mainWindow) {
//                 mainWindow.hide();
//                 mainWindow.reload();
//             }
//         }, 500);
//     }, 500);
// });
//
// ipcMain.on('save-as', function(event, arg) {
//     var input = dialog.showSaveDialog(mainWindow, arg.options);
//     event.returnValue = input || false;
// });
//
// ipcMain.on('open-file', function(event, arg) {
//     var input = dialog.showOpenDialog(mainWindow, arg.options);
//     event.returnValue = input || false;
// });
//
// ipcMain.on('loading-status', function(event, status) {
//     splashScreen && splashScreen.webContents.send('loading-status', status);
// });
//
// ipcMain.on('main-loading-done', function() {
//     if (splashScreen && mainWindow) {
//         mainWindow.show();
//         splashScreen.close();
//     }
// });
//
// ipcMain.on('ta-loading-done', function() {
//     if (splashScreen && academyWindow) {
//         academyWindow.show();
//         splashScreen.close();
//         scrollAcademyWindow();
//     }
// });
//
// app.on('ready', function() {
//     createAppMenus();
//     createMainSplash();
//     setTimeout(function() {
//         splashScreen.show();
//         createMainWindow();
//     }, 500);
// });

initialize();
