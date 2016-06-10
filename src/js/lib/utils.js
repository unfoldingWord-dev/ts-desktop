// util module

;(function () {
    'use strict';

    var diacritics = require('./diacritics'),
        getmac = require('getmac'),
        fs = require('fs'),
        path = require('path'),
        fse = require('fs-extra'),
        https = require('https'),
        http = require('http'),
        fontkit = require('fontkit'),
        _ = require('lodash');

    var utils = {
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
         * Pads date/time with a leading zero if it's a single digit
         */
        padZero: function(t) {
            return ('0' + t.toString()).slice(-2);
        },

        mapObject: function (obj, visit, filter) {
            var keys = Object.getOwnPropertyNames(obj);

            if (filter) {
                keys = keys.filter(function (key) {
                    return filter(obj[key], key, obj);
                });
            }

            return keys.reduce(function (a, key) {
                a[key] = visit(obj[key], key, obj);
                return a;
            }, {});
        },

        /**
         * Turns a standard callback method into a promise-style method.
         *  Assumes standard node.js style:
         *      someFunction(arg1, arg2, function(err, data) { ... })
         *
         *  This will pass the proper number of arguments and convert
         *      the callback structure to a Promise.
         *
         * e.g. var readdir = promisify(fs, 'readdir'),
         *          readdir('something').then(someFunction);
         *
         *      var rm = promisify(rimraf),
         *          rm('something').then(someFunction);
         */
        promisify: function (module, fn) {
            var hasModule = typeof module !== 'function',
                f = hasModule ? module[fn] : module,
                mod = hasModule ? module : null;

            return function () {
                var args = [],
                    i = arguments.length - 1;

                /**
                 *  Don't pass an arguments list that has undefined values at the end.
                 *      This is so the callback for function gets passed in the right slot.
                 *
                 *      If the function gets passed:
                 *          f(arg1, arg2, undefined, cb)
                 *
                 *      ...it will think it got an undefined cb.
                 *
                 *      We instead want it to get passed:
                 *          f(arg1, arg2, cb)
                 *
                 *      Before:    [arg1, null, undefined, arg2, undefined, undefined]
                 *      After:     [arg1, null, undefined, arg2]
                 */
                while (i >= 0 && typeof arguments[i] === 'undefined') {
                    --i;
                }
                while (i >= 0) {
                    args.unshift(arguments[i]);
                    --i;
                }

                return new Promise(function (resolve, reject) {
                    try {
                        f.apply(mod, args.concat(function (err, data) {
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
         *  Ignores certain properties on a modules so the return values is not polluted.
         *  (This can be configured by passing in a filter function via opts.isValid.)
         *
         *  E.g.    var myFs = promisifyAll(fs),
         *              myFs.readdir('somedir').then(doSomething);
         */
        promisifyAll: function (module, opts) {
            var config = opts || {},
                isValid = config.isValid || function (f, fn, mod) {
                    /**
                     * Filter out functions that aren't 'public' and aren't 'methods' and aren't asynchronous.
                     *  This is mostly educated guess work based on de facto naming standards for js.
                     *
                     * e.g.
                     *      valid:        'someFunctionName' or 'some_function_name' or 'someFunctionAsync'
                     *      not valid:    'SomeConstructor' or '_someFunctionName' or 'someFunctionSync'
                     *
                     *  As there may be exceptions to these rules for certain modules,
                     *   you can pass in a function via opts.isValid which will override this.
                     */
                    return typeof f === 'function' && fn[0] !== '_' && fn[0].toUpperCase() !== fn[0] && !fn.endsWith('Sync');
                };

            return utils.mapObject(module, function (f, fn, mod) {
                return utils.promisify(mod, fn);
            }, isValid);
        },

        /**
         * NOTE: This is super meta.
         *
         * Reverses the order of arguments for a module's method,
         *  and creates a curried function.
         *
         */
        guard: function (module, fn) {
            return function (cb) {
                var visit = typeof cb === 'function' ? function (v) { return cb(v); } : cb;
                return function (collection) {
                    return module[fn](collection, visit);
                };
            };
        },

        guardAll: function (module, opts) {
            var config = opts || {},
                isValid = config.isValid || function (f, fn, mod) {
                    /**
                     * Filter out functions that aren't 'public' and aren't 'methods'.
                     *  This is mostly educated guess work based on de facto naming standards for js.
                     *
                     * e.g.
                     *      valid:        'someFunctionName' or 'some_function_name'
                     *      not valid:    'SomeConstructor' or '_someFunctionName'
                     *
                     *  As there may be exceptions to these rules for certain modules,
                     *   you can pass in a function via opts.isValid which will override this.
                     */
                    return typeof f === 'function' && fn[0] !== '_' && fn[0].toUpperCase() !== fn[0];
                };

            return utils.mapObject(module, function (f, fn, mod) {
                return utils.guard(mod, fn);
            }, isValid);
        },

        every: function (visit, onFail, opts) {
            var action = utils.wrap(visit),
                fail = onFail ? onFail : utils.ret(false),
                config = opts || { compact: true };

            return function (list) {
                var promises = list.map(action).map(function (promise) {
                    return promise.catch(fail);
                });

                return Promise.all(promises).then(function (results) {
                    return config.compact ? results.filter(Boolean) : results;
                });
            };
        },

        chain: function (visit, onFail, opts) {
            var fail = onFail ? onFail : utils.ret(false),
                config = opts || { compact: true };

            return function (list) {
                var p = Promise.resolve(false),
                    results = [];

                list.forEach(function (l) {
                    p = p.then(visit.bind(null, l))
                         .catch(fail)
                         .then(function (result) {
                             results.push(result);
                         });
                });

                return p.then(function () {
                    return config.compact ? results.filter(Boolean) : results;
                });
            };
        },

        wrap: function (fn) {
            return function (arg) {
                return fn(arg);
            };
        },

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
         *
         *  This function can be useful in Promises, although it will break the chain.
         *
         *  To log without breaking the Promise chain, see: logr
         *
         *  Before:
         *
         *     if (!testEnv) {
         *         console.log('hi there');
         *     }
         *
         *     somePromise.then(function (result) {
         *         if (!testEnv) {
         *             console.log(result);
         *         }
         *     });
         *
         *  After:
         *
         *     log('hi there');
         *
         *     somePromise.then(log);
         */
        log: function () {
            var args = [].slice.apply(arguments);
            if (process.env.NODE_ENV !== 'test') {
                console.log.apply(console, args);
            }
            return args;
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

        logr: function () {
            var args = [].slice.apply(arguments);

            return function (data) {
                var d = Array.isArray(data) ? [data] : data; // so it concats the array itself
                utils.log.apply(null, args.concat(d));
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
        },

        makeProjectPaths: function (baseDir, project) {
            var targetDir = baseDir,
                projectName = typeof project === 'object' ? project.unique_id : project,
                projectDir = path.join(targetDir, projectName);

            return {
                parentDir: targetDir,
                projectDir: projectDir,
                manifest: path.join(projectDir, 'manifest.json'),
                license: path.join(projectDir, 'LICENSE.md')
            };

        },

        getSystemFonts: function () {
            var fontDir = path.resolve({
                win32:  '/Windows/fonts',
                darwin: '/Library/Fonts',
                linux:  '/usr/share/fonts/truetype'
            }[process.platform]);

            var fontpaths = fs.readdirSync(fontDir).map(function (name) {
                return path.join(fontDir, name);
            });

            var list = fontpaths.map(function (fontpath) {
                var font = false;
                try {
                    font = fontkit.openSync(fontpath);
                } catch (e) {}
                if (font) {
                    return {path: fontpath, font: font};
                } else {
                    return false;
                }
            }).map(function (fontobject) {
                var name = false;
                try {
                    name = fontobject.font.familyName;
                } catch (e) {}
                if (name) {
                    return {path: fontobject.path, name: name};
                } else {
                    return false;
                }
            });
            
            list = _.compact(list);
            
            list = list.sort(function (a, b) {
                if (a.name.toLowerCase() > b.name.toLowerCase()) {
                    return 1;
                } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
                    return -1;
                } else {
                    return 0;
                }
            });

            for (var i = 0; i < list.length - 1; i++) {
                if (list[i].name === list[i+1].name) {
                    list.splice(i, 1);
                    i--;
                }
            }

            list.unshift({path: "default", name: 'Noto Sans'}, {path: "default", name: 'Roboto'});

            return list;
        },

        getTimeStamp: function () {
            var date = new Date(),
                year = date.getFullYear(),
                month = ("0" + (date.getMonth() + 1)).slice(-2),
                day = ("0" + date.getDate()).slice(-2),
                hour = ("0" + date.getHours()).slice(-2),
                minutes = ("0" + date.getMinutes()).slice(-2),
                seconds = ("0" + date.getSeconds()).slice(-2);

            return year + '-' + month + '-' + day + '_' + hour + '.' + minutes + '.' + seconds;
        }
    };

    /**
     * See note on 'promisify' function for example usage.
     */
    utils.fs = utils.promisifyAll(fse);
    utils.lodash = utils.guardAll(_);

    module.exports = utils;
}());
