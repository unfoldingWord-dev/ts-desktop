/**
 * Defines the application context.
 * This context will be available throughout the application
 */

this.App = (function() {
    'use strict';
    let config = require('../config/ts-config.json');
    let gui = require('nw.gui');
    let mainWindow = gui.Window.get();
    let reporter = require('../js/reporter.js');

    /**
     * FIX - This provides a fix to the native chrome shadow missing
     * see: https://github.com/nwjs/nw.js/issues/2903#issuecomment-77099590
     */
    function shadowFix(win) {
       win.minimize();
       win.restore();
    }

    /**
     * The App is the global application context object.
     */
    let App = {
        appName: 'translationStudio',

        gui: gui,

        config: config,

        window: mainWindow,

        reporter: reporter,

        isMaximized: false,

        display: function() {
            let win = this.window;
            win.show();
            win.focus();
        },

        /**
         * The application is shutting down
         */
        close: function() {
            this.window.close();
        },

        events: {
            maximize: function() {
                this.isMaximized = true;
            },

            minimize: function() {
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

                active: function() {
                    this.window.showDevTools('', true);
                }
            }
        },

        registerEvents: function() {
            let me = this;
            let win = me.window;

            Object.keys(me.events).forEach(function(event) {
                win.on(event, me.events[event]);
            });
        },

        registerShortcuts: function() {
            let me = this;

            Object.keys(me.shortcuts).forEach(function(shortcutName) {
                let s = me.shortcuts[shortcutName];

                let option = { key: s.key };

                ['active', 'failed'].filter(function(prop) {
                    return typeof s[prop] === 'function';
                }).forEach(function(prop) {
                    // bind "this" to "me" and pass in the shortcut as the first param
                    option[prop] = s[prop].bind(me, s);
                });

                var shortcut = new me.gui.Shortcut(option);

                // Register global desktop shortcut, which can work without focus.
                me.gui.App.registerGlobalHotKey(shortcut);
            });
        },

        /**
         * Toggles the application maximize state
         */
        toggleMaximize: function() {
            let win = this.window;
            this.isMaximized ? win.unmaximize() : win.maximize();
        },

        /**
         * Individual platform initializations (if needed)
         */
        platformInit: {
            darwin: function() {
                let mb = new this.gui.Menu({ type: 'menubar' });
                mb.createMacBuiltin(this.appName);
                this.window.menu = mb;
            },
            win32: function() {
                shadowFix(this.window);
            }
        },

        init: function() {
            let me = this;

            me.registerEvents();
            me.registerShortcuts();

            let platformInit = me.platformInit[process.platform];
            platformInit && platformInit.call(me);

            me.display();
        }

    };

    App.init();

    return App;
})();
