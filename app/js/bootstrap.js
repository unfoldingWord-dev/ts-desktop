/**
 * Defines the application context.
 * This context will be available throughout the application
 */

;(function (root) {
    'use strict';

    let path = require('path');
    let Configurator = require('../js/configurator').Configurator;
    let configurator = new Configurator();
    let gui = require('nw.gui');
    let mainWindow = gui.Window.get();
    let Reporter = require('../js/reporter').Reporter;
    let uploader = require('../js/uploader');
    let Translator = require('../js/translator').Translator;
    let Library = require('../js/library').Library;
    let ProjectsManager = require('../js/projects').ProjectsManager;

    let util = require('../js/lib/util');

    /**
     * FIX - This provides a fix to the native chrome shadow missing
     * see: https://github.com/nwjs/nw.js/issues/2903#issuecomment-77099590
     */
    function shadowFix (win) {
        win.minimize();
        win.restore();
    }

    /**
     * The App is the global application context object.
     */
    let App = {
        appName: 'translationStudio',

        gui: gui,

        configurator: configurator,

        window: mainWindow,

        uploader: uploader,

        util: util,

        isMaximized: false,

        display: function () {
            let win = this.window;

            if (!win.shown) {
                win.show();
                win.shown = true;
                this.reporter.logNotice("Starting GUI");
                // NOTE: needs to be in a setTimeout, otherwise doesn't work properly
                setTimeout(win.focus.bind(win), 1);
            }
        },

        reload: function () {
            this.window.removeAllListeners();
            this.window.reload();
        },

        showDevTools: function () {
            this.window.showDevTools('', true);
        },

        /**
         * The application is shutting down
         */
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

        /**
         * NOTE: Ctrl and Alt will be mapped to Command and Option on Mac at runtime.
         *  Also, "this" is bound to the App for convenience,
         *  and the shortcut is passed as first param.
         */
        shortcuts: {
            devInspector: {
                key: 'Ctrl+Alt+I',

                active: function () {
                    App.showDevTools();
                }
            },
            reload: {
                key: 'Ctrl+R',

                active: function () {
                    App.reload();
                }
            }
        },

        registerEvents: function () {
            let _this = this;
            let win = _this.window;

            Object.keys(_this.events).forEach(function (event) {
                win.on(event, _this.events[event].bind(_this));
            });
        },

        registerShortcuts: function () {
            let _this = this;

            Object.keys(_this.shortcuts).forEach(function (shortcutName) {
                let s = _this.shortcuts[shortcutName];

                let option = {key: s.key};

                ['active', 'failed'].filter(function (prop) {
                    return typeof s[prop] === 'function';
                }).forEach(function (prop) {
                    // bind "this" to "me" and pass in the shortcut as the first param
                    option[prop] = s[prop].bind(_this, s);
                });

                let shortcut = new _this.gui.Shortcut(option);

                // Register global desktop shortcut, which can work without focus.
                _this.gui.App.registerGlobalHotKey(shortcut);
            });
        },


        /**
         * Loads read-only and default configuration settings
         */
        initializeConfig: function () {
            let _this = this;

            _this.configurator.setStorage(window.localStorage);

            let config = require('../config/ts-config');
            let defaults = require('../config/defaults');

            _this.configurator.loadConfig(config);
            _this.configurator.loadConfig(defaults);
            _this.configurator.setValue('rootDir', gui.App.dataPath, {'mutable':false});
            _this.configurator.setValue('targetTranslationsDir', path.join(gui.App.dataPath, 'targetTranslations'), {'mutable':false});
            _this.configurator.setValue('indexDir', path.join(gui.App.dataPath, 'index'), {'mutable':false});
        },

        /**
         * Initializes the translator
         */
        initializeTranslator: function () {
            // TODO: the translator needs some information about the context (first parameter)
            this.translator = new Translator({}, this.configurator.getValue('targetTranslationsDir'));
        },

        /**
         * Initializes the library
         */
        initializeLibrary: function () {
            // TODO: we probably want to place the index some where in the users's data directory. see the configurator
            this.library = new Library(path.join('./', 'config', 'schema.sql'), './index/index.sqlite', configurator.getValue('apiUrl'));
        },

        initializeProjectsManager: function () {
            this.projectsManager = new ProjectsManager(this.library.indexer.db);
        },

        /**
         * Toggles the application maximize state
         */
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
                let mb = new this.gui.Menu({type: 'menubar'});
                mb.createMacBuiltin(this.appName);
                this.window.menu = mb;
            },
            win32: function () {
                shadowFix(this.window);
            }
        },

        initializeReporter: function () {
            let _this = this;

            let logPath = path.join(configurator.getValue('rootDir'), 'log.txt');

            _this.reporter = new Reporter({
                logPath: logPath,
                repoOwner: configurator.getValue('repoOwner'),
                repo: configurator.getValue('repo'),
                maxLogFileKb: configurator.getValue('maxLogFileKb'),
                appVersion: require('../package.json').version
            });

            _this.reporter.logNotice("Logs are being written to " + logPath);

            return _this.reporter;
        },

        /**
         * A hook for global error catching
         */
        registerErrorReporter: function () {
            process.removeAllListeners('uncaughtException');
            process.on('uncaughtException', function (err) {
                let date = new Date();
                date = date.getFullYear() + '_' + date.getMonth() + '_' + date.getDay();
                let path = configurator.getValue('crashDir') + '/' +  date + '.crash';
                let crashReporter = new Reporter({logPath: path});
                crashReporter.logError(err.message + '\n' + err.stack, function () {
                    /**
                     * TODO: Hook in a UI
                     * Currently the code quits quietly without notifying the user
                     * This should probably be the time when the user chooses to submit what happened or not
                     * then we restart the application
                     */
                    gui.App.quit();
                });
            });
        },

        init: function () {
            let _this = this;

            _this.registerEvents();
            _this.registerShortcuts();
            _this.initializeConfig();
            _this.initializeTranslator();
            _this.initializeLibrary();
            _this.initializeProjectsManager();
            _this.initializeReporter();
            _this.registerErrorReporter();

            let platformInit = _this.platformInit[process.platform];
            platformInit && platformInit.call(_this);

            _this.display();
        }
    };

    App.init();

    root.App = App;
})(this);

/*
 * For development purposes, reload on changes.
 *
 * From: https://github.com/nwjs/nw.js/wiki/Livereload-nw.js-on-changes
 */

;(function (root) {
    'use strict';

    if (process.env.DEBUG_MODE) {
        let gulp;

        try {
            gulp = require('gulp');
        } catch (e) {
            console.log('Gulp not found.', e);
        }

        if (gulp) {
            console.log('Initiating auto reload...');

            gulp.task('html', function () {
                root.App.reload();
            });

            gulp.task('css', function () {
                let styles = document.querySelectorAll('link[rel=stylesheet]');

                for (let i = 0; i < styles.length; i++) {
                    // reload styles
                    let restyled = styles[i].getAttribute('href') + '?v=' + Math.random(0, 10000);
                    styles[i].setAttribute('href', restyled);
                }
            });

            gulp.watch(['**/*.css'], ['css']);
            gulp.watch(['**/*.html'], ['html']);
        }
    }
})(this);
