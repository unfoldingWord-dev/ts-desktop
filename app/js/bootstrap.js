/**
 * Defines the application context.
 * This context will be available throughout the application
 */


function ApplicationContext() {
    var self = this;
    var isMaximized = false;

    /**
     * Constructor
     */
    function construct() {
        self.gui = require("nw.gui");
        self.window = self.gui.Window.get();
        shadowFix();
        self.window.show();
        self.window.focus();

    }

    /**
     * FIX - This provides a fix to the native chrome shadow missing
     * see: https://github.com/nwjs/nw.js/issues/2903#issuecomment-77099590
     */
    function shadowFix() {
        self.window.minimize();
        self.window.restore();
    }

    /**
     * The application is shutting down
     */
    self.close = function() {
        self.window.close();
    }

    /**
     * Toggles the application maximize state
     */
    self.toggleMaximize = function() {
        if(isMaximized) {
            App.window.unmaximize();
            isMaximized = false;
        } else {
            App.window.maximize();
            isMaximized = true;
        }
    }

    /**
     * TRICKY: execute the constructor after all public methods and variables have been defined
     * Otherwise the constructor will not find them.
     */
    construct();
};

var App = new ApplicationContext();
