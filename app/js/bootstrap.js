/**
* Defines the application context.
* This context will be available throughout the application
*/

'use strict';

let path = require('path');
let fs = require('fs');
let Reporter = require('../js/reporter').Reporter;

// hook up global exception handler
process.removeAllListeners('uncaughtException');
process.on('uncaughtException', function (err) {
    let date = new Date();
    date = date.getFullYear() + '_' + date.getMonth() + '_' + date.getDay();
    let crashPath = path.join(root.App.dataPath, 'logs', date + '.crash');
    let crashReporter = new Reporter({logPath: crashPath});
    crashReporter.logError(err.message + '\n' + err.stack, function () {
        /**
         * TODO: Hook in a UI
         * Currently the code quits quietly without notifying the user
         * This should probably be the time when the user chooses to submit what happened or not
         * then we restart the application
         */
    });
});

let Configurator = require('../js/configurator').Configurator;
let configurator = new Configurator();
let Git = require('../js/git').Git;
let git = new Git();
let Uploader = require('../js/uploader').Uploader;
let uploader = new Uploader();
let Translator = require('../js/translator').Translator;
let Library = require('../js/library').Library;
let ProjectsManager = require('../js/projects').ProjectsManager;
let i18n = new require('../js/i18n').Locale('./i18n');//, mainWindow.navigator.language),
let util = require('../js/lib/util');
let printer = new require('../js/printer').Printer();

/**
 * The App is the global application context object.
 */
var App = {
    appName: 'translationStudio',

    locale: i18n,

    configurator: configurator,

    window: mainWindow,

    uploader: uploader,

    util: util,

    git: git,

    printer: printer,

    isMaximized: false,

    close: function () {
        this.window.close();
    },

    events: {
        maximize: function () {
            this.isMaximized = true;
        },

        unmaximize: function () {
            this.isMaximized = false;
        },

        minimize: function () {
            this.isMaximized = false;
        }
    },

    registerEvents: function () {
        // let _this = this;
        // let win = _this.window;

        // Object.keys(_this.events).forEach(function (event) {
        //     win.on(event, _this.events[event].bind(_this));
        // });
    },

    /**
     * Loads read-only and default configuration settings
     */
    initializeConfig: function () {
        let _this = this;

        _this.configurator.setStorage(window.localStorage);

        let defaults = require('../config/defaults');

        if(fs.exists(path.normalize('../config/private'))) {
            let privateDefaults = require('../config/private');
            _this.configurator.loadConfig(privateDefaults);
        }

        _this.configurator.loadConfig(defaults);
        _this.configurator.setValue('rootDir', gui.App.dataPath, {'mutable':false});
        _this.configurator.setValue('targetTranslationsDir', path.join(gui.App.dataPath, 'targetTranslations'), {'mutable':false});
        _this.configurator.setValue('tempDir', path.join(gui.App.dataPath, 'temp'), {'mutable':false});
        _this.configurator.setValue('indexDir', path.join(gui.App.dataPath, 'index'), {'mutable':false});
    },

    initializeTranslator: function () {
        // TODO: the translator needs some information about the context (first parameter)
        this.translator = new Translator({}, this.configurator.getValue('targetTranslationsDir'));
    },

    initializeLibrary: function () {
        // TODO: we probably want to place the index some where in the users's data directory. see the configurator
        this.library = new Library(path.join('./', 'config', 'schema.sql'), './index/index.sqlite', configurator.getValue('apiUrl'));
    },

    initializeProjectsManager: function () {
        var db = this.library.indexer.db;
        this.projectsManager = new ProjectsManager(db.exec.bind(db), this.configurator);
    },

    toggleMaximize: function () {
        let win = this.window,
            isMax = this.isMaximized;

        return isMax ? win.unmaximize() : win.maximize(), !isMax;
    },

    /**
     * Individual platform initializations (if needed)
     */
    platformInit: {
        darwin: function () {

        },
        win32: function () {

        }
    },

    initializeReporter: function () {
        let _this = this;

        let logPath = path.join(configurator.getValue('rootDir'), 'log.txt');

        _this.reporter = new Reporter({
            logPath: logPath,
            oauthToken: configurator.getValue("github-oauth"),
            repoOwner: configurator.getValue('repoOwner'),
            repo: configurator.getValue('repo'),
            maxLogFileKb: configurator.getValue('maxLogFileKb'),
            appVersion: require('../package.json').version
        });

        _this.reporter.logNotice("Logs are being written to " + logPath);

        return _this.reporter;
    },

    init: function () {
        let _this = this;

        _this.registerEvents();
        _this.initializeConfig();
        _this.initializeTranslator();
        _this.initializeLibrary();
        _this.initializeProjectsManager();
        _this.initializeReporter();

        let platformInit = _this.platformInit[process.platform];
        platformInit && platformInit.call(_this);
    }
};

App.init();

window.App = App;
