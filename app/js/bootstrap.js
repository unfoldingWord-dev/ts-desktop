/**
 * Defines the application context.
 * This context will be available throughout the application
 */

this.App = (function () {
    'use strict';
    let configurator = require('../js/configurator');
    let gui = require('nw.gui');
    let mainWindow = gui.Window.get();
    let reporter = require('../js/reporter.js');
    let uploader = require('../js/uploader.js');

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

        reporter: new reporter.instance({
            logPath:configurator.getString('logPath'),
            repoOwner: configurator.getString('repoOwner'),
            repo: configurator.getString('repo'),
            maxLogFileKb: configurator.getInt('maxLogFileKb'),
            appVersion: require('../package.json').version
        }),

        uploader: uploader,

        isMaximized: false,

        display: function () {
            let win = this.window;
            win.show();
            win.focus();
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
                    this.window.showDevTools('', true);
                }
            }
        },

        registerEvents: function () {
            let _this = this;
            let win = _this.window;

            Object.keys(_this.events).forEach(function (event) {
                win.on(event, _this.events[event]);
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

                var shortcut = new _this.gui.Shortcut(option);

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

            var config = require('../config/ts-config');
            var defaults = require('../config/defaults');

            _this.configurator.loadConfig(config);
            _this.configurator.loadConfig(defaults);
        },

        /**
         * Toggles the application maximize state
         */
        toggleMaximize: function () {
            let win = this.window;
            this.isMaximized ? win.unmaximize() : win.maximize();
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

        /**
         * A hook for global error catching
         */
        registerErrorReporter: function () {
            process.on('uncaughtException', function (err) {
                var date = new Date();
                date = date.getFullYear() + '_' + date.getMonth() + '_' + date.getDay();
                var path = configurator.getString('crashDir') + '/' +  date + '.crash';
                var crashReporter = new reporter.instance({logPath: path});
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

        initializeUploader: function () {
            uploader.setServerInfo({
                'host': configurator.getString('authServer'),
                'port': configurator.getString('authServerPort')
            });
        },

        init: function () {
            let _this = this;

            _this.registerEvents();
            _this.registerShortcuts();
            _this.initializeConfig();
            _this.registerErrorReporter();
            _this.initializeUploader();

            let platformInit = _this.platformInit[process.platform];
            platformInit && platformInit.call(_this);

            _this.display();
        }
    };

    App.init();

    return App;
})();
