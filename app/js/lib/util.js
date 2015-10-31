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

    /**
     * Convert strings to camelcased variable name
     * source: http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
     */
    function camelize (a) {
        return a.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    }

    exports.raiseWithContext = raiseWithContext;
    exports.removeDiacritics = diacritics.removeDiacritics;
    exports.startsWithBase = startsWithBase;
    exports.camelize = camelize;

}());
