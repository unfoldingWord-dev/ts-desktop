// util module

;(function () {
    'use strict';

    var diacritics = require('./diacritics'),
        mkdirP = require('mkdirp'),
        rimraf = require('rimraf'),
        getmac = require('getmac'),
        fs = require('fs'),
        fse = require('fs-extra'),
        https = require('https'),
        http = require('http'),
        _ = require('lodash');

    // TODO: Should this use Prototypes? How can we create this so it's only instantiated once?

    var utils = {

        /**
         *  Lodash or equivalent library
         */
        _: _,

        /**
         * NOTE: Determines if a string is a valid path
         * @param string: the string to be tested
         */
        isValidPath: function (string) {
            string = string.replace(/\//g, '\\');
            var os = process.platform;
            var win_path = /^(((\\\\([^\\/:\*\?"\|<>\. ]+))|([a-zA-Z]:\\))(([^\\/:\*\?"\|<>\. ]*)([\\]*))*)$/;
            var linux_path = /^[\/]*([^\/\\ \:\*\?"<\>\|\.][^\/\\\:\*\?\"<\>\|]{0,63}\/)*$/;
            var isValid = false;

            if (os === 'win64' || os === 'win32') {
                isValid = win_path.test(string);
            } else if (os === 'linux' || os === 'darwin') {
                isValid = linux_path.test(string);
            } else {
                console.warn('OS is not recognized', os);
            }

            return isValid;
        },

        /**
         * Raises an exception along with some context to provide better debugging
         * @param e the exception to be raised
         * @param args arguments to be added to the exception message
         */
        raiseWithContext: function (e, args) {
            e.message += '\nException Context:';
            for (let prop in args) {
                if (args.hasOwnProperty(prop)) {
                    e.message += '\n\t' + prop + '=' + args[prop];
                }
            }
            e.message += '\n';
            throw e;
        },

        /**
         * Ignores diacritics and ignores case.
         */
        startsWithBase: function (a, b) {
            let rm = diacritics.removeDiacritics,
                aBase = rm(a.toLowerCase()),
                bBase = rm(b.toLowerCase());
            return bBase.startsWith(aBase);
        },

        /**
         * Convert strings to camelcased variable name
         * source: http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
         */
        camelize: function (a) {
            return a.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
                return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
            }).replace(/\s+/g, '');
        },

        /**
         * Turns a standard callback method into a promise-style method.
         *
         * e.g. var readdir = promisify(fs, 'readdir'),
         *          readdir('something').then(someFunction);
         */
        promisify: function (module, fn) {
            var f = module ? module[fn] : fn;

            return function (arg1, arg2, arg3) {
                var args = (function () {
                    var narg = function (arg) { return typeof arg === 'undefined'; };

                    if (narg(arg1) && narg(arg2)) {
                        return [];
                    }
                    if (narg(arg2)) {
                        return [arg1];
                    }
                    if (narg(arg3)) {
                        return [arg1, arg2];
                    }
                    return [arg1, arg2, arg3];
                })();

                return new Promise(function (resolve, reject) {
                    try {
                        f.apply(module, args.concat(function (err, data) {
                            return err ? reject(err) : resolve(data);
                        }));
                    } catch (err) {
                        reject(err);
                    }
                });
            };
        },

        /**
         * Calls promisify on all valid functions on a module.
         * Returns an Array.
         */
        promisifyAll: function (module) {
            var m = module;

            return Object.keys(m).filter(function (key) {
                return (typeof m[key] === 'function' && !key.startsWith('_') && key[0].toUpperCase() !== key[0]);
            }).reduce(function (a, methodName) {
                a[methodName] = utils.promisify(m, methodName);
                return a;
            }, {});
        },

        /**
         * NOTE: This is super meta.
         *
         * Reverses the order of arguments for a lodash (or equivalent) method,
         *  and creates a curried function.
         *
         */
        guard: function (method) {
            return function (cb) {
                var visit = typeof cb === 'function' ? function (v) { return cb(v); } : cb;
                return function (collection) {
                    return utils._[method](collection, visit);
                };
            };
        },

        /**
         * Alias for binding console.log. Useful in Promises.
         *  See also, 'logr'
         *
         *  Before:
         *
         *     somePromise.then(function (result) {
         *         console.log(result);
         *     });
         *
         *  After:
         *
         *     somePromise.then(puts);
         */
        puts: console.log.bind(console),

        /**
         * Creates a function that returns the data when called.
         *  E.g.
         *      var myData = 'bob';
         *      var getData = ret(myData);
         *      getData(); // returns 'bob'
         *
         * Useful in Promises:
         *
         *  Before:
         *      var myData = 'bob';
         *
         *      somePromise.then(function (doesntMatter) {
         *          return myData;
         *      });
         *
         *  After:
         *      var myData = 'bob';
         *
         *      somePromise.then(ret(myData));
         */
        ret: function (data) {
            return function () {
                return data;
            };
        },

        /**
         *  A wrapper for console.log that can be silenced based on the NODE_ENV.
         *   This is useful for running grunt/gulp tests, so that no output shows.
         */
        log: function () {
            if (process.env.NODE_ENV !== 'test') {
                console.log.apply(console, arguments);
            }
        },

        /**
         * A version of log for Promises.
         * Logs a custom message along with the result of the promise.
         * Will also return the result so that the chain is not broken.
         *
         *  Before:
         *
         *      somePromise.then(function (result) {
         *          console.log('My message', result);
         *          return result;
         *      }).then(function (result) {
         *          // do something with 'result'
         *      });
         *
         *  After:
         *
         *      somePromise.then(logr('My message')).then(function (result) {
         *          // do something with 'result'
         *      });
         */

        logr: function (msg) {
            return function () {
                var data = arguments.length === 1 ? arguments[0] : arguments;
                utils.log(msg, data);
                return data;
            };
        },

        /**
         * Performs a file download over https
         * @param url the url to download
         * @param dest the location where the file will be downloaded
         * @param secure if true https will be used
         * @returns {Promise}
         */
        download: function (url, dest, secure) {
            secure = !!secure;

            return new Promise(function(resolve, reject) {
                let out = fs.createWriteStream(dest);
                let protocol = secure ? https : http;

                protocol.get(url, function(response) {
                    response.pipe(out);

                    out.on('finish', function() {
                        out.close(resolve);
                    });
                }).on('error', function(err) {
                    fs.unlink(dest);
                    reject(err.message);
                });
            });
        },

        /**
         * Returns a consistent MAC address format across Windows/Mac/Linux.
         */
        getDeviceId: function () {
            var getMac = utils.promisify(getmac, 'getMac');

            return getMac().then(function (mac) {
                return mac.replace(/-|:/g, '');
            });
        }
    };

    /**
     * See note on 'promisify' function for example usage.
     */
    utils.fs = utils.promisifyAll(fs);

    /**
     * Some functions that are commonly guarded for use in a Promise chain.
     *  e.g. Normally, you'd have to do this:
     *
     *      somePromise.then(function (data) {
     *          return _.map(data, function (item) {
     *              return doSomethingToItem(item);
     *          })
     *      });
     *
     *  Now, you can just do this (same as above):
     *
     *      somePromise.then(map(function(item) {
     *          return doSomethingToItem(item);
     *      }));
     *
     *  Or, even better:
     *
     *      somePromise.then(map(doSomethingToItem));
     */

    utils.map = utils.guard('map');
    utils.indexBy = utils.guard('indexBy');
    utils.flatten = utils.guard('flatten');
    utils.compact = utils.guard('compact');

    // TODO: Add more guard functions, like _.find, and test them
    // TODO: Add some Promise utils, like Promise.every, etc.

    /**
     * NOTE: These are deprecated.
     *  The functions in fs-extra or elsewhere should replace these,
     *  which should be available in utils.fs, etc.
     */

    utils.move = utils.promisify(fse, 'move');
    utils.mkdirp = utils.promisify(null, mkdirP);
    utils.rm = utils.promisify(null, rimraf);

    module.exports = utils;
}());
