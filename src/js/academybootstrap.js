/**
* Defines the application context.
* This context will be available throughout the application
*/

'use strict';
/*
 * Redirect all standard output to the console.
 * NB: This is required for the sql.js library to work.
 */
process.stderr.write = console.error.bind(console);
process.stdout.write = console.log.bind(console);

(function () {
    let ipcRenderer = require('electron').ipcRenderer;

    const DATA_PATH = ipcRenderer.sendSync('main-window', 'dataPath');

    let path = require('path');
    let fs = require('fs');
    let mkdirp = require('mkdirp');
    let Db = require('door43-client');
    let Reporter = require('../js/reporter').Reporter;
    let Configurator = require('../js/configurator').Configurator;
    let DataManager = require('../js/database').DataManager;
    let Renderer = require('../js/render').Renderer;
    let i18n = require('../js/i18n').Locale(path.resolve(path.join(__dirname, '..', '..', 'i18n')));
    let utils = require('../js/lib/utils');

    let configurator = (function () {
        var c = new Configurator();

        c.setStorage(window.localStorage);

        let defaults = require('../config/defaults');

        try {
            let privateDefaults = require('../config/private.json');
            c.loadConfig(privateDefaults);
        } catch (e) {
            console.info('No private settings.');
        }

        c.loadConfig(defaults);
        c.setValue('rootDir', DATA_PATH, {'mutable':false});
        c.setValue('targetTranslationsDir', path.join(DATA_PATH, 'targetTranslations'), {'mutable':false});
        c.setValue('tempDir', path.join(DATA_PATH, 'temp'), {'mutable':false});
        c.setValue('libraryDir', path.join(DATA_PATH, 'library'), {'mutable':false});
        c.setValue('indexDir', path.join(DATA_PATH, 'index'), {'mutable':false});
        return c;
    })();

    let reporter = new Reporter({
        logPath: path.join(configurator.getValue('rootDir'), 'log.txt'),
        oauthToken: configurator.getValue('github-oauth'),
        repoOwner: configurator.getValue('repoOwner'),
        repo: configurator.getValue('repo'),
        maxLogFileKb: configurator.getValue('maxLogFileKb'),
        appVersion: require('../../package.json').version,
        verbose: true
    });

    let dataManager = (function () {
        var libraryDir = configurator.getValue('libraryDir');
        var libraryPath = path.join(libraryDir, "index.sqlite");
        var srcDir = path.resolve(path.join(__dirname, '..'));
        var resourceDir = path.join(libraryDir, 'resource_containers');
        var srcResource = path.join(srcDir, 'index', 'resource_containers');
        var apiURL = configurator.getUserSetting('mediaserver') + "/v2/ts/catalog.json";

        var db = new Db(libraryPath, resourceDir);

        return new DataManager(db, resourceDir, apiURL, srcResource);
    })();

    var App = {
        appName: 'translationStudio',

        locale: i18n,

        ipc: ipcRenderer,

        get window () {
            return this._window('main-window');
        },

        get academyWindow () {
            return this._window('academy-window');
        },

        _window: function (windowName) {
            var ipc = ipcRenderer,
                send = ipc.sendSync.bind(ipc, windowName);

            return {
                close: send.bind(ipc, 'close'),
                minimize: send.bind(ipc, 'minimize'),
                maximize: send.bind(ipc, 'maximize'),
                unmaximize: send.bind(ipc, 'unmaximize'),
                isMaximized: send.bind(ipc, 'isMaximized')
            };
        },

        close: function () {
            this.window.close();
        },

        showDevTools: function () {
            require('electron').remote.getCurrentWindow().toggleDevTools();
        },

        utils: utils,

        configurator: configurator,

        reporter: reporter,

        dataManager: dataManager,

        renderer: (function () {
            return new Renderer();
        })()

    };

    window.App = App;

})();
