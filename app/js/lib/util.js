// util module

;(function () {
    'use strict';

    var diacritics = require('./diacritics'),
        _ = require('lodash');

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

    function promisify (module, fn) {
        var f = module ? module[fn] : fn;

        return function (arg1, arg2) {
            var args = (function () {
                var narg = function (arg) { return typeof arg === 'undefined'; };

                if (narg(arg1) && narg(arg2)) return [];
                if (narg(arg2)) return [arg1];
                return [arg1, arg2];
            })();

            return new Promise(function (resolve, reject) {
                f.apply(module, args.concat(function (err, data) {
                    return err ? reject(err) : resolve(data);
                }));
            });
        };
    }

    /**
     * NOTE: This is super meta.
     *
     * Reverses the order of arguments for a lodash (or equivalent) method,
     *  and creates a curried function.
     *
     */

    function guard (method) {
        return function (cb) {
            var visit = typeof cb === 'function' ? function (v) { return cb(v); } : cb;
            return function (collection) {
                return _[method](collection, visit);
            };
        };
    }

    exports.raiseWithContext = raiseWithContext;
    exports.removeDiacritics = diacritics.removeDiacritics;
    exports.startsWithBase = startsWithBase;
    exports.camelize = camelize;
    exports.promisify = promisify;
    exports.guard = guard;

}());
