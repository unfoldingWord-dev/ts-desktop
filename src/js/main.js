'use strict';

var electron = require('electron'),
    dialog = electron.dialog,
    path = require('path'),
    app = electron.app,
    BrowserWindow = electron.BrowserWindow,
    ipcMain = electron.ipcMain;

app.setPath('userData', path.join(process.env.localappdata, 'translationstudio'));

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let academyWindow;

function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 980,
        height: 580,
        minWidth: 800,
        minHeight: 580,
        useContentSize: true,
        center: true,
        title: app.getName(),
        backgroundColor: '#00796B',
        autoHideMenuBar: true,
        frame: false
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
    // Create the browser window.
    academyWindow = new BrowserWindow({
        width: 980,
        height: 580,
        minWidth: 800,
        minHeight: 580,
        useContentSize: true,
        center: true,
        title: app.getName(),
        backgroundColor: '#00796B',
        autoHideMenuBar: true
    });

    // mainWindow.webContents.openDevTools();

    // and load the index.html of the app.
    academyWindow.loadURL('file://' + __dirname + '/../views/index.html');

    academyWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        academyWindow = null;
    });

    academyWindow.focus();
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

ipcMain.on('openacademy', function (event, arg) {
    createAcademyWindow();
});

ipcMain.on('save-as', function (event, arg) {
    var input = dialog.showSaveDialog(mainWindow, {defaultPath: arg.name});
    event.returnValue = input || false;
});

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
