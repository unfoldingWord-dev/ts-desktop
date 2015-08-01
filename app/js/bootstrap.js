/**
 * Defines the application context.
 * This context will be available throughout the application
 */

;(function(root) {
    'use strict';
    
    let gui = require('nw.gui');
    let mainWindow = gui.Window.get();
    
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
        
        window: mainWindow,
        
        isMaximized: false,
        
        display: function() {
            let win = this.window;
            win.show();
            // NOTE: needs to be in a setTimeout, otherwise doesn't work properly
            setTimeout(win.focus.bind(win), 1);
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
            
            unmaximize: function() {
                this.isMaximized = false;
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
                win.on(event, me.events[event].bind(me));
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
            let win = this.window,
                isMax = this.isMaximized;
            
            return isMax ? win.unmaximize() : win.maximize(), !isMax;
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
    
    root.App = App;
})(self);

/*
 * For development purposes, reload on changes.
 *
 * From: https://github.com/nwjs/nw.js/wiki/Livereload-nw.js-on-changes
 */

;(function(root) {
    'use strict';
    
    if (process.env.DEBUG_MODE) {
        let gulp;

        try {
            gulp = require('gulp');
        } catch(e) {
            console.log('Gulp not found.', e);
        }

        if (gulp) {
            console.log('Initiating auto reload...');
    
            gulp.task('html', function () {
                if (location) location.reload();
            });

            gulp.task('css', function () {
              let styles = document.querySelectorAll('link[rel=stylesheet]');

              for (let i = 0; i < styles.length; i++) {
                  // reload styles
                  let restyled = styles[i].getAttribute('href') + '?v='+Math.random(0,10000);
                  styles[i].setAttribute('href', restyled);
              };
            });

            gulp.watch(['**/*.css'], ['css']);
            gulp.watch(['**/*.html'], ['html']);
        }
    }
})(self);
