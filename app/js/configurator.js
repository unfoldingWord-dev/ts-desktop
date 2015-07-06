
/**
 * Created by joel on 6/23/2015.
 */

const readOnlyPrefix = 'locked|';
const defaultPrefix = 'default|';

var storage;

var getValue = function(key) {
    'use strict';

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

var setValue = function(key, value) {
    'use strict';
    if (key === undefined || value === undefined) {
        return;
    }
    key = key.toLowerCase();
    value = value.toString();

    storage[key] = value;
};
var unsetValue = function(key) {
    'use strict';
    if (key === undefined) {
        return;
    }
    key = key.toLowerCase();

    // Don't allow unsetting of read-only or default values
    var unsetOk = true;
    [defaultPrefix, readOnlyPrefix].forEach(function(prefix) {
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
var setReadOnlyValue = function(key, value) {
    'use strict';
    setValue(readOnlyPrefix + key, value);
};
var setDefaultValue = function(key, value) {
    'use strict';
    setValue(defaultPrefix + key, value);
};
var getKeys = function() {
    'use strict';
    return Object.keys(storage);
};

var configurator = {
    setStorage: function(storeObject) {
        'use strict';
        storage = storeObject;
    },

    getString: function(key) {
        'use strict';
        var value = getValue(key);
        if (value === undefined) {
            return '';
        }

        return value;
    },
    getInt: function(key) {
        'use strict';
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
    getBool: function(key) {
        'use strict';
        var value = getValue(key);
        if (value === undefined) {
            return false;
        }

        return value.toLowerCase() !== 'false' && value !== '0';
    },
    setValue: function(key, value) {
        'use strict';
        setValue(key, value);
    },
    loadConfig: function(config) {
        'use strict';

        if (storage === undefined) {
            throw 'You must call setStorage with a valid storage object first';
        }

        for (var i = 0; i < config.length; i++) {
            if (config[i].default !== undefined) {
                if (config[i].readonly) {
                    setReadOnlyValue(config[i].name, config[i].default);
                } else {
                    setDefaultValue(config[i].name, config[i].default);
                }
            }
        }
    },
    unsetValue: function(key, value) {
        'use strict';
        unsetValue(key, value);
    },
    purgeValues: function() {
        'use strict';
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
