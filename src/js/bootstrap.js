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

    let path = require('path'),
        // fs = require('fs'),  // Never used?
        mkdirp = require('mkdirp'),
        ipcRenderer = require('electron').ipcRenderer,
        Reporter = require('../js/reporter').Reporter,
        Configurator = require('../js/configurator').Configurator,
        Git = require('../js/git').Git,
        Uploader = require('../js/uploader').Uploader,
        Db = require('../js/lib/db').Db,
        ProjectsManager = require('../js/projects').ProjectsManager,
        i18n = require('../js/i18n').Locale('./i18n'),
        util = require('../js/lib/util'),
        printer = require('../js/printer').Printer();

    const DATA_PATH = ipcRenderer.sendSync('main-window', 'dataPath');

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



    // TODO: where should this be?
    mkdirp.sync(configurator.getValue('targetTranslationsDir'));

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

        git: new Git(),

        printer: printer,

        projectsManager: (function () {
            // TODO: should we move the location of these files/folders outside of the src folder?
            var schemaPath = path.join('.', 'src', 'config', 'schema.sql'),
                dbPath = path.join('.', 'src', 'index', 'index.sqlite'),
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

    window.App = App;

})();
