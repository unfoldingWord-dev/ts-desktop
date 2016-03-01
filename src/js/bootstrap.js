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

    setMsg('Loading path...')
    let path = require('path');

    setMsg('Loading mkdirp...');
    let mkdirp = require('mkdirp');

    setMsg('Loading Reporter...');
    let Reporter = require('../js/reporter').Reporter;

    setMsg('Loading Configurator...');
    let Configurator = require('../js/configurator').Configurator;

    setMsg('Loading Git...');
    let git = require('../js/git');

    setMsg('Loading Uploader...');
    let Uploader = require('../js/uploader').Uploader;

    setMsg('Loading DB...');
    let Db = require('../js/lib/db').Db;

    setMsg('Loading Projects Manager...');
    let ProjectsManager = require('../js/projects').ProjectsManager;

    setMsg('Loading Locale...');
    let i18n = require('../js/i18n').Locale(path.resolve(path.join(__dirname, '..', '..', 'i18n')));

    setMsg('Loading Utils...');
    let util = require('../js/lib/util');

    setMsg('Loading Printer...');
    let printer = require('../js/printer').Printer();

    setMsg('Initializing...');

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
        c.setValue('indexDir', path.join(DATA_PATH, 'index'), {'mutable':false});

        return c;
    })();



    // TODO: where should these be?
    mkdirp.sync(configurator.getValue('targetTranslationsDir'));
    mkdirp.sync(configurator.getUserPath('datalocation', 'automatic_backups'));
    mkdirp.sync(configurator.getUserPath('datalocation', 'backups'));

    var App = {
        appName: 'translationStudio',

        locale: i18n,

        configurator: configurator,

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

        uploader: new Uploader(),

        util: util,

        git: git,

        printer: printer,

        projectsManager: (function () {
            // TODO: should we move the location of these files/folders outside of the src folder?
            var srcDir = path.resolve(path.join(__dirname, '..')),
                schemaPath = path.join(srcDir, 'config', 'schema.sql'),
                dbPath = path.join(srcDir, 'index', 'index.sqlite'),
                db = new Db(schemaPath, dbPath);

            return new ProjectsManager(db, configurator);
        })(),

        reporter: new Reporter({
            logPath: path.join(configurator.getValue('rootDir'), 'log.txt'),
            oauthToken: configurator.getValue("github-oauth"),
            repoOwner: configurator.getValue('repoOwner'),
            repo: configurator.getValue('repo'),
            maxLogFileKb: configurator.getValue('maxLogFileKb'),
            appVersion: require('../../package.json').version
        })
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
