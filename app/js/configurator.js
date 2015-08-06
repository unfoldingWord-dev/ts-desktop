/**
 * ts.Configurator
 * settings manager that uses local storage by default, but can be overridden to use any storage provider.
 * Configurations are stored as complex key values (includes type, mutability, etc)
 */

 ;(function () {
    'use strict';

    var readOnlyPrefix = 'locked|';
    var defaultPrefix = 'default|';

    var storage = {};

    var getValue = function (key) {
        if (key === undefined) {
            return key;
        }
        key = key.toLowerCase();

        // first check for a readonly setting
        var value = storage[readOnlyPrefix + key];

        if (value === undefined) {
            // then a regular setting
            value = storage[key];
        }
        if (value === undefined) {
            // lastly use a default (if present)
            value = storage[defaultPrefix + key];
        }

        return value;
    };

    var setValue = function (key, value) {
        if (key === undefined || value === undefined) {
            return;
        }
        key = key.toLowerCase();
        value = value.toString();

        storage[key] = value;
    };
    var unsetValue = function (key) {
        if (key === undefined) {
            return;
        }
        key = key.toLowerCase();

        // Don't allow unsetting of read-only or default values
        var unsetOk = true;
        [defaultPrefix, readOnlyPrefix].forEach(function (prefix) {
            unsetOk = unsetOk && key.substr(0, prefix.length) !== prefix;
        });

        if (unsetOk) {
            if (typeof storage.removeItem === 'function') {
                storage.removeItem(key);
            } else {
                storage[key] = undefined;
            }
        }
    };
    var setReadOnlyValue = function (key, value) {
        setValue(readOnlyPrefix + key, value);
    };
    var setDefaultValue = function (key, value) {
        setValue(defaultPrefix + key, value);
    };
    var getKeys = function () {
        return Object.keys(storage);
    };

    var configurator = {
        setStorage: function (storeObject) {
            storage = storeObject;
        },

        getString: function (key) {
            var value = getValue(key);
            if (value === undefined) {
                return '';
            }

            return value;
        },
        getInt: function (key) {
            var value = getValue(key);
            if (value === undefined) {
                return 0;
            }

            value = parseInt(value, 10);
            if (isNaN(value)) {
                return 0;
            }


            return value;
        },
        getBool: function (key) {
            var value = getValue(key);
            if (value === undefined) {
                return false;
            }

            return value.toLowerCase() !== 'false' && value !== '0';
        },
        setValue: function (key, value) {
            setValue(key, value);
        },
        loadConfig: function (config) {
            if (storage === undefined) {
                throw 'Storage is undefined. Please call setStorage with a valid storage object';
            }

            for (var i = 0; i < config.length; i++) {
                if (config[i].value !== undefined) {
                    if (config[i].meta.mutable) {
                        setDefaultValue(config[i].name, config[i].value);
                    } else {
                        setReadOnlyValue(config[i].name, config[i].value);
                    }
                }
            }
        },
        unsetValue: function (key, value) {
            unsetValue(key, value);
        },
        purgeValues: function () {
            var keys = getKeys();
            for (var i = 0; i < keys.length; i++) {
                unsetValue(keys[i]);
            }
        }
    };

    exports.setStorage = configurator.setStorage;
    exports.getString = configurator.getString;
    exports.getInt = configurator.getInt;
    exports.getBool = configurator.getBool;
    exports.setValue = configurator.setValue;
    exports.unsetValue = configurator.unsetValue;
    exports.loadConfig = configurator.loadConfig;
    exports.purgeValues = configurator.purgeValues;

})();
