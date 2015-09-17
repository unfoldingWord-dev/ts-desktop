// util module

;(function () {
    'use strict';

    var diacritics = require('./diacritics');

    /**
     * Raises an exception along with some context to provide better debugging
     * @param e the exception to be raised
     * @param args arguments to be added to the exception message
     */
    function raiseWithContext (e, args) {
        e.message += '\nException Context:';
        for (let prop in args) {
            if (args.hasOwnProperty(prop)) {
                e.message += '\n\t' + prop + '=' + args[prop];
            }
        }
        e.message += '\n';
        throw e;
    };

    /**
     * Ignores diacritics and ignores case.
     */
    function startsWithBase (a, b) {
        let rm = diacritics.removeDiacritics,
            aBase = rm(a.toLowerCase()),
            bBase = rm(b.toLowerCase());
        return bBase.startsWith(aBase);
    }

    exports.raiseWithContext = raiseWithContext;
    exports.removeDiacritics = diacritics.removeDiacritics;
    exports.startsWithBase = startsWithBase;

}());
