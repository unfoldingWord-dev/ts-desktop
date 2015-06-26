/**
 * Created by joel on 6/23/2015.
 */

const readOnlyPrefix = 'locked|';
const defaultPrefix = 'default|';

var getValue = function(key) {
    'use strict';

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

        return value === 'true' || value === '1';
    },
    setValue: function(key, value) {
        'use strict';
        window.localStorage[key] = value;
    },
    setValueReadOnly: function(key, value) {
        'use strict';
        this.setValue(readOnlyPrefix + key, value);
    },
    setValueDefault: function(key, value) {
        'use strict';
        this.setValue(defaultPrefix + key, value);
    },
    loadConfig: function(config) {
        'use strict';
        var keys = Object.keys(config);
        for(var i = 0; i < keys.length; i++){
            this.setValueReadOnly(keys[i], config[keys[i]]);
        }
    },
    loadDefaults: function(config) {
        'use strict';
        var keys = Object.keys(config);
        for(var i = 0; i < keys.length; i++){
            this.setValueDefault(keys[i], config[keys[i]]);
        }
    }
};


exports.getString = configurator.getString;
exports.getInt = configurator.getInt;
exports.getBool = configurator.getBool;
exports.setValue = configurator.setValue;
exports.setValueReadOnly = configurator.setValueReadOnly;
exports.setValueDefault = configurator.setValueDefault;
exports.loadConfig = configurator.loadConfig;
exports.loadDefaults = configurator.loadDefaults;
