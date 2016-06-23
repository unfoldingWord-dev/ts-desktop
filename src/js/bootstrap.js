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
    let setMsg = ipcRenderer.send.bind(ipcRenderer, 'loading-status');

    setMsg('Bootstrapping...');

    const DATA_PATH = ipcRenderer.sendSync('main-window', 'dataPath');

    setMsg('Loading path...');
    let path = require('path');
    let fs = require('fs');

    setMsg('Loading mkdirp...');
    let mkdirp = require('mkdirp');

    setMsg('Loading DB...');
    let Db = require('../js/lib/db').Db;

    setMsg('Loading Reporter...');
    let Reporter = require('../js/reporter').Reporter;

    setMsg('Loading Configurator...');
    let Configurator = require('../js/configurator').Configurator;

    setMsg('Loading Git Manager...');
    let GitManager = require('../js/gitnative').GitManager;

    setMsg('Loading Key Manager...');
    let KeyManager = require('../js/keys').KeyManager;

    setMsg('Loading Projects Manager...');
    let ProjectsManager = require('../js/projects').ProjectsManager;

    setMsg('Loading Migrate Manager...');
    let MigrateManager = require('../js/migrator').MigrateManager;

    setMsg('Loading Data Manager...');
    let DataManager = require('../js/database').DataManager;

    setMsg('Loading User Manager...');
    let UserManager = require('../js/user').UserManager;

    setMsg('Loading Import Manager...');
    let ImportManager = require('../js/importer').ImportManager;

    setMsg('Loading Export Manager...');
    let ExportManager = require('../js/exporter').ExportManager;

    setMsg('Loading Print Manager...');
    let PrintManager = require('../js/printer').PrintManager;

    setMsg('Loading Renderer...');
    let Renderer = require('../js/render').Renderer;

    setMsg('Loading Locale...');
    let i18n = require('../js/i18n').Locale(path.resolve(path.join(__dirname, '..', '..', 'i18n')));

    setMsg('Loading Utils...');
    let utils = require('../js/lib/utils');

    setMsg('Initializing configurator...');

    // TODO: refactor this so we can just pass an object to the constructor
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
        appVersion: require('../../package.json').version
    });

    let dataManager = (function () {
        var libraryDir = configurator.getValue('libraryDir');
        var libraryPath = path.join(libraryDir, "index.sqlite");
        var srcDir = path.resolve(path.join(__dirname, '..'));
        var schemaPath = path.join(srcDir, 'config', 'schema.sql');
        var srcDB = path.join(srcDir, 'index', 'index.sqlite');
        var appData = configurator.getAppData();
        var stat;

        try {
            stat = fs.statSync(libraryPath);
        } catch(e) {}

        if (!stat || configurator.getValue("libraryBuild") != appData.build) {
            setMsg('Setting up index files...');            
            mkdirp.sync(libraryDir);
            var content = fs.readFileSync(srcDB);
            fs.writeFileSync(libraryPath, content);
            configurator.setValue("libraryBuild", appData.build);
        }

        var db = new Db(schemaPath, libraryPath);

        return new DataManager(db);
    })();

    setMsg('Initializing modules...');

    let gitManager = (function () {
        return new GitManager();
    })();

    let migrateManager = (function () {
        return new MigrateManager(configurator, gitManager);
    })();

    // TODO: where should this be?
    mkdirp.sync(configurator.getValue('targetTranslationsDir'));

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
            require('remote').getCurrentWindow().toggleDevTools();
        },

        utils: utils,

        configurator: configurator,

        reporter: reporter,

        dataManager: dataManager,

        gitManager: gitManager,

        migrateManager: migrateManager,

        renderer: (function () {
            return new Renderer();
        })(),

        keyManager: (function () {
            return new KeyManager(DATA_PATH);
        })(),

        printManager: (function () {
            return new PrintManager(configurator);
        })(),

        projectsManager: (function () {
            return new ProjectsManager(dataManager, configurator, reporter, gitManager, migrateManager);
        })(),

        userManager: (function () {
            return new UserManager({
                token: configurator.getValue('gogs-token')
            });
        })(),

        importManager: (function () {
            return new ImportManager(configurator, migrateManager, dataManager);
        })(),

        exportManager: (function () {
            return new ExportManager(configurator, gitManager);
        })()
    };

    // hook up global exception handler
    // process.removeAllListeners('uncaughtException');
    // process.on('uncaughtException', function (err) {
    //     let date = new Date();
    //     date = date.getFullYear() + '_' + date.getMonth() + '_' + date.getDay();
    //     let crashPath = path.join(DATA_PATH, 'logs', date + '.crash');
    //     let crashReporter = new Reporter({logPath: crashPath});
    //     crashReporter.logError(err.message + '\n' + err.stack, function () {
    //         /**
    //          * TODO: Hook in a UI
    //          * Currently the code quits quietly without notifying the user
    //          * This should probably be the time when the user chooses to submit what happened or not
    //          * then we restart the application
    //          */
    //     });
    // });

    setMsg('Loading UI...');

    window.App = App;

})();
