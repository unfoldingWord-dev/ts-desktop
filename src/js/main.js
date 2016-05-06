'use strict';

var electron = require('electron'),
    Menu = require('menu'),
    dialog = electron.dialog,
    path = require('path'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain;

app.setPath('userData', (function (dataDir) {
    var base = process.env.LOCALAPPDATA ||
        (process.platform == 'darwin'
            ? path.join(process.env.HOME, 'Library', 'Application Support')
            : path.join(process.env.HOME, '.config'));

    return path.join(base, dataDir);
})('translationstudio'));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let splashScreen;
let mainWindow;
let academyWindow;

function createSplashScreen() {
    splashScreen = new BrowserWindow({
        width: 400,
        height: 170,
        resizable: false,
        autoHideMenuBar: true,
        frame: false,
        center: true,
        title: 'translationStudio'
    });

    splashScreen.loadURL('file://' + __dirname + '/../views/splash-screen.html');

    splashScreen.on('closed', function() {
        splashScreen = null;
    });
}

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 980,
        height: 580,
        minWidth: 800,
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

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/../views/index.html');

    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    mainWindow.on('maximize', function () {
        mainWindow.webContents.send('maximize');
    });

    mainWindow.on('unmaximize', function () {
        mainWindow.webContents.send('unmaximize');
    });

    mainWindow.focus();
}

function createAcademyWindow () {

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
        frame: false
    });

    //academyWindow.webContents.openDevTools();

    academyWindow.loadURL('file://' + __dirname + '/../views/academy.html');

    academyWindow.on('closed', function() {
        academyWindow = null;
    });

    academyWindow.on('maximize', function () {
        academyWindow.webContents.send('maximize');
    });

    academyWindow.on('unmaximize', function () {
        academyWindow.webContents.send('unmaximize');
    });

    academyWindow.focus();
}

function createAppMenus() {
    // Create the Application's main menu
    var template = [
        {
            label: "Application",
            submenu: [
                { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
                { type: "separator" },
                { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
            ]
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Toggle Developer Tools",
                    accelerator: "Shift+CmdOrCtrl+I",
                    click: function () {
                        var w = BrowserWindow.getFocusedWindow();
                        w && w.webContents.openDevTools();
                    }
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on('main-window', function (event, arg) {
    if (typeof mainWindow[arg] === 'function') {
        let ret = mainWindow[arg]();
        event.returnValue = !!ret;
    } else if (mainWindow[arg]) {
        event.returnValue = mainWindow[arg];
    } else {
        event.returnValue = null;
    }
});

ipcMain.on('academy-window', function (event, arg) {
    if (typeof academyWindow[arg] === 'function') {
        let ret = academyWindow[arg]();
        event.returnValue = !!ret;
    } else if (academyWindow[arg]) {
        event.returnValue = academyWindow[arg];
    } else {
        event.returnValue = null;
    }
});

ipcMain.on('openacademy', function (event, arg) {
    if (academyWindow) {
        academyWindow.show();
        academyWindow.focus();
    } else {
        createAcademyWindow();
    }
});

ipcMain.on('save-as', function (event, arg) {
    var input = dialog.showSaveDialog(mainWindow, arg.options);
    event.returnValue = input || false;
});

ipcMain.on('open-file', function (event, arg) {
    var input = dialog.showOpenDialog(mainWindow, arg.options);
    event.returnValue = input || false;
});

ipcMain.on('loading-status', function (event, status) {
    splashScreen && splashScreen.webContents.send('loading-status', status);
});

ipcMain.on('loading-done', function (event) {
    if (splashScreen && mainWindow) {
        splashScreen.close();
        mainWindow.show();
        mainWindow.focus();
    }
});

app.on('ready', function () {
    createAppMenus();
    createSplashScreen();
    setTimeout(function () {
        createWindow();
    }, 500);
});

app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // if (process.platform !== 'darwin') {
        app.quit();
    // }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
