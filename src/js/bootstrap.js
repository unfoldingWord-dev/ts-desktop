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
require("regenerator-runtime/runtime");

(function() {
    let ipcRenderer = require('electron').ipcRenderer;
    let setMsg = ipcRenderer.send.bind(ipcRenderer, 'loading-status');

    setMsg('Bootstrapping...');

    try {
        const DATA_PATH = ipcRenderer.sendSync('main-window', 'dataPath');

        // stub globals
        let path = null;
        let fs = null;
        let fse = null;
        let mkdirp = null;
        let Db = null;
        let Reporter = null;
        let Configurator = null;
        let GitManager = null;
        let KeyManager = null;
        let ProjectsManager = null;
        let MigrateManager = null;
        let DataManager = null;
        let UserManager = null;
        let ImportManager = null;
        let ExportManager = null;
        let PrintManager = null;
        let Renderer = null;
        let i18n = null;
        let utils = null;
        let submitFeedback = null;

        // catch startup errors
        try {
            // check version change
            let nextVersion = require('../../package.json').version;
            let lastVersion = window.localStorage['version'];

            window.localStorage['version-changed'] = lastVersion !== nextVersion;
            window.localStorage['version'] = nextVersion;
            if(lastVersion !== nextVersion) {
                window.localStorage['last-version'] = lastVersion;
            }

            setMsg('Loading path...');
            path = require('path');
            fs = require('fs');
            fse = require('fs-extra');

            setMsg('Loading mkdirp...');
            mkdirp = require('mkdirp');

            setMsg('Loading DB...');
            Db = require('door43-client');

            setMsg('Loading Reporter...');
            Reporter = require('../js/reporter').Reporter;

            setMsg('Loading Configurator...');
            Configurator = require('../js/configurator').Configurator;

            setMsg('Loading Git Manager...');
            GitManager = require('../js/gitnative').GitManager;

            setMsg('Loading Key Manager...');
            KeyManager = require('../js/keys').KeyManager;

            setMsg('Loading Projects Manager...');
            ProjectsManager = require('../js/projects').ProjectsManager;

            setMsg('Loading Migrate Manager...');
            MigrateManager = require('../js/migrator').MigrateManager;

            setMsg('Loading Data Manager...');
            DataManager = require('../js/database').DataManager;

            setMsg('Loading Feedback reporter...');
            submitFeedback = require('../js/feedback').submitFeedback;

            setMsg('Loading User Manager...');
            UserManager = require('../js/user').UserManager;

            setMsg('Loading Import Manager...');
            ImportManager = require('../js/importer').ImportManager;

            setMsg('Loading Export Manager...');
            ExportManager = require('../js/exporter').ExportManager;

            setMsg('Loading Print Manager...');
            PrintManager = require('../js/printer').PrintManager;

            setMsg('Loading Renderer...');
            Renderer = require('../js/render').Renderer;

            setMsg('Loading Locale...');
            i18n = require('../js/i18n').
                Locale(path.resolve(path.join(__dirname, '..', '..', 'i18n')));

            setMsg('Loading Utils...');
            utils = require('../js/lib/utils');
        } catch (err) {
            // display error and fail
            setMsg(err.message);
            throw new Error(err);
        }

        // deploy packaged tA material. See src/js/academy/util.js for implementation details.
        const tADir = path.join(DATA_PATH, 'translationAcademy');
        if(window.localStorage['version-changed'] === 'true' || !fs.existsSync(tADir)) {
            try {
                console.log('Installing tA.');
                const src = path.join(__dirname, '../index/ta');
                const dest = DATA_PATH;
                const cacheCatalog = require("../js/academy/util").cacheCatalog;
                const AdmZip = require("adm-zip");

                const catalogPath = path.join(src, 'catalog.json');
                const catalog = JSON.parse(fs.readFileSync(catalogPath).toString());
                cacheCatalog(catalog);

                const articlesZip = path.join(src, 'translationAcademy.zip');
                const zip = new AdmZip(articlesZip);
                zip.extractAllTo(dest, true);
            } catch (error) {
                // NOTE: the user can recover from this later by opening tA.
                console.error('Failed to install tA', error);
            }
        }

        setMsg('Initializing configurator...');

        // TODO: refactor this so we can just pass an object to the constructor
        let configurator = (function() {
            var c = new Configurator();

            c.setStorage(window.localStorage);
            if(window.localStorage['version-changed'] === 'true') {
                console.info('Restoring default settings');
                c.restoreDefaultSettings();
            }

            let defaults = require('../config/defaults');

            try {
                let privateDefaults = require('../config/private.json');
                c.loadConfig(privateDefaults);
            } catch (e) {
                console.info('No private settings.');
            }

            c.loadConfig(defaults);
            c.setValue('rootDir', DATA_PATH, {'mutable': false});
            c.setValue('targetTranslationsDir',
                path.join(DATA_PATH, 'targetTranslations'), {'mutable': false});
            c.setValue('tempDir', path.join(DATA_PATH, 'temp'),
                {'mutable': false});
            c.setValue('libraryDir', path.join(DATA_PATH, 'library'),
                {'mutable': false});
            c.setValue('indexDir', path.join(DATA_PATH, 'index'),
                {'mutable': false});
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

        let dataManager = (function() {
            var libraryDir = configurator.getValue('libraryDir');
            var libraryPath = path.join(libraryDir, 'index.sqlite');
            var srcDir = path.resolve(path.join(__dirname, '..'));
            var resourceDir = path.join(libraryDir, 'resource_containers');
            var srcDB = path.join(srcDir, 'index', 'index.sqlite');
            var srcResource = path.join(srcDir, 'index', 'resource_containers');
            var apiURL = configurator.getUserSetting('mediaserver').replace(/\/+$/, '') + '/v2/ts/catalog.json';
            var indexstat;

            try {
                indexstat = fs.statSync(libraryPath);
            } catch (e) {
            }

            if (!indexstat) {
                setMsg('Setting up index file...');
                mkdirp.sync(libraryDir);
                var content = fs.readFileSync(srcDB);
                fs.writeFileSync(libraryPath, content);
            }
            mkdirp.sync(resourceDir);

            var db = new Db(libraryPath, resourceDir);

            return new DataManager(db, resourceDir, apiURL, srcResource, DATA_PATH);
        })();

        setMsg('Initializing modules...');

        let gitManager = new GitManager();

        let migrateManager = new MigrateManager(configurator, gitManager,
            reporter,
            dataManager);

        // TODO: where should this be?
        mkdirp.sync(configurator.getValue('targetTranslationsDir'));

        var App = {
            appName: 'translationStudio',

            locale: i18n,

            ipc: ipcRenderer,

            get window() {
                return this._window('main-window');
            },

            get academyWindow() {
                return this._window('academy-window');
            },

            _window: function(windowName) {
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

            close: function() {
                this.window.close();
            },

            showDevTools: function() {
                require('electron').remote.getCurrentWindow().toggleDevTools();
            },

            utils: utils,

            configurator: configurator,

            reporter: reporter,

            submitFeedback: submitFeedback,

            dataManager: dataManager,

            gitManager: gitManager,

            migrateManager: migrateManager,

            renderer: (function() {
                return new Renderer();
            })(),

            keyManager: (function() {
                return new KeyManager(DATA_PATH);
            })(),

            printManager: (function() {
                return new PrintManager(configurator);
            })(),

            projectsManager: (function() {
                return new ProjectsManager(dataManager, configurator, reporter,
                    gitManager, migrateManager);
            })(),

            userManager: (function() {
                return new UserManager({
                        token: configurator.getValue('gogs-token')
                    },
                    configurator.getUserSetting('dataserver')
                );
            })(),

            importManager: (function() {
                return new ImportManager(configurator, migrateManager,
                    dataManager);
            })(),

            exportManager: (function() {
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
    } catch (e) {
        setMsg(e.message);
        throw e;
    }
})();
