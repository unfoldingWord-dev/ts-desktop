/**
 * Created by joel on 6/23/2015.
 */

const readOnlyPrefix = 'locked|';
const defaultPrefix = 'default|';

var getValue = function(key) {
    'use strict';

    if (key === undefined) {
        return key;
    }
    key = key.toLowerCase();

    // first check for a readonly setting
    var value = window.localStorage[readOnlyPrefix + key];
    if (value === undefined) {
        // then a regular setting
        value = window.localStorage[key];
    }
    if (value === undefined) {
        // lastly use a default (if present)
        value = window.localStorage[defaultPrefix + key];
    }

    return value;
};

var setValue = function(key, value) {
    'use strict';
    if (key === undefined) {
        return key;
    }
    key = key.toLowerCase();

    window.localStorage[key] = value;
};
var unsetValue = function(key) {
    'use strict';
    if (key === undefined) {
        return;
    }
    key = key.toLowerCase();

    // Don't allow unsetting of read-only or default values
    var unsetOk = true;
    [defaultPrefix,readOnlyPrefix].forEach(function(prefix) {
        unsetOk = unsetOk && key.substr(0,prefix.length) !== prefix;
    });

    if (unsetOk) {
        window.localStorage.removeItem(key);
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
    return Object.keys(window.localStorage);
};

var configurator = {
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
        var keys = Object.keys(config);
        for(var i = 0; i < keys.length; i++){
            setReadOnlyValue(keys[i], config[keys[i]]);
        }
    },
    loadDefaults: function(config) {
        'use strict';
        var keys = Object.keys(config);
        for(var i = 0; i < keys.length; i++){
            setDefaultValue(keys[i], config[keys[i]]);
        }
    },
    unsetValue: function(key, value) {
        'use strict';
        unsetValue(key, value);
    },
    purgeValues: function() {
        'use strict';
        var keys = getKeys();
        for(var i = 0; i < keys.length; i++){
            unsetValue(keys[i]);
        }
    }
};


exports.getString = configurator.getString;
exports.getInt = configurator.getInt;
exports.getBool = configurator.getBool;
exports.setValue = configurator.setValue;
exports.unsetValue = configurator.unsetValue;
exports.loadConfig = configurator.loadConfig;
exports.loadDefaults = configurator.loadDefaults;
exports.purgeValues = configurator.purgeValues;
