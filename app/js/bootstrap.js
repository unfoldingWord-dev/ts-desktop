/**
 * Defines the application context.
 * This context will be available throughout the application
 */

this.App = (function() {
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
    
    let App = {
        appName: 'translationStudio',
        
        gui: gui,
        
        window: mainWindow,
        
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
            let win = me.window;

            Object.keys(me.events).forEach(function(event) {
                win.on(event, me.events[event]);
            });
            
            let platformInit = me.platformInit[process.platform];
            platformInit && platformInit.call(me);
            
            me.display();
        }
    };
    
    App.init();
    
    return App;
})();
