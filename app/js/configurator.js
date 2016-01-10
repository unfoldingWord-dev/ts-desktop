/**
 * ts.Configurator
 * settings manager that uses local storage by default, but can be overridden to use any storage provider.
 * Configurations are stored by key as stringified JSON (meta includes type, mutability, etc)
 */

;(function () {
    'use strict';

    let _ = require('lodash');
    let userSetting = require('../config/user-setting');

    function Configurator () {
        let storage = {};

        let getValue = function (key) {
            if (!key) { return key; }

            key = key.toLowerCase();
            let valueObj = JSON.parse(storage[key] || '{}');
            let metaObj = valueObj.meta || {'default': ''};

            return valueObj.value || metaObj.default;
        };

        let getMetaValue = function (key, metaKey) {
            if (!key) { return key; }
            
            key = key.toLowerCase();
            let valueObj = JSON.parse(storage[key] || '{}');

            return valueObj.meta[metaKey] || '';
        };

        let setValue = function (key, value, meta) {
            if (!key || !value) { return; }
            
            key = key.toLowerCase();
            value = typeof value === 'boolean' || typeof value === 'number' ? value : value.toString();

            if (getMetaValue(key, 'mutable') === false) { return; }

            let emptyStorageObj = {'value': value, 'meta': {'mutable': true, 'type': typeof value, 'default': ''}};
            let valueObj = storage[key] !== undefined ? JSON.parse(storage[key]) : emptyStorageObj;
            valueObj.value = value;
            valueObj.meta = _.merge(valueObj.meta, meta);

            storage[key] = JSON.stringify(valueObj);
        };

        let unsetValue = function (key) {
            if (!key) { return; }

            key = key.toLowerCase();

            if (getMetaValue(key, 'mutable') === false) { return; }

            if (typeof storage.removeItem === 'function') {
                storage.removeItem(key);
            } else {
                storage[key] = undefined;
            }
        };

        let setReadOnlyValue = function (key, value) {
            setValue(key, value, {'mutable': false});
        };

        let setDefaultValue = function (key, value) {
            setValue(key, value, {'default': value || ''});
        };

        let getKeys = function () {
            return Object.keys(storage);
        };

        let fontSizeMap = {
            'normal': '100%',
            'small': '90%',
            'smaller': '80%',
            'large': '110%',
            'larger': '120%'
        };

        // This is the returned object
        let configurator = {

            /**
             * Returns the storage being used
             * @returns {object}
             */
            _storage: function() {
                return storage;
            },

            /**
             * Set the storage object used for this app
             * @param storeObject
             */
            setStorage: function (storeObject) {
                storage = storeObject;
            },

            /**
             * Write the whole (mapped) setting array to the user's preferred storage
             * @param settingArr
             */
            saveUserSettingArr: function(settingArr) {
                storage['user-setting'] = JSON.stringify(settingArr);
            },

            /**
             * Fetch the (mapped) setting array
             * @return setting array from user's storage or from default file
             */
            getUserSettingArr: function() {
                return this.mapUserSettings(this.getDefaultUserSettingArr());
            },

            /**
             * Fetch the raw and default setting array from JSON file
             * @return setting array from user-setting.json
             */
            getDefaultUserSettingArr: function() {
                return userSetting;
            },

            /**
             * Get the value of a setting
             * @param name: of the user setting
             * @return value of the user setting
             */
            getUserSetting: function(name) {
                var s = this.getUserSettingArr();
                var list = _.find(s, {'list': [{'name': name}]}).list;
                return _.find(list, {'name': name}).value;
            },

            /**
             * Map the raw setting array into groups and lists for UI to display
             * @param settingArr: array of setting objects
             * @param groupOrder: (optional) array of string of group name
             * @return array of setting-group objects
             */
            mapUserSettings: function(settingArr, groupOrder) {
                var settingObj = {};
                var groupOrder = groupOrder || [];
                var settingAdded = [];

                // Group setting objects by the given group order
                groupOrder.forEach(function(order) {
                    if (!settingObj.order) settingObj[order] = [];
                    settingArr.forEach(function(setting) {
                        if (setting.group.toLowerCase() === order.toLowerCase()) {
                            settingObj[order].push(setting);
                            settingAdded.push(setting);
                        }
                    });
                    settingArr = _.difference(settingArr, settingAdded);
                });

                // Take the remaining setting and append them grouped by their "group"
                settingArr.forEach(function(setting) {
                    if (!settingObj[setting.group]) settingObj[setting.group] = [];
                    settingObj[setting.group].push(setting);
                });

                // Return mapped/grouped/orderd object as an array
                return _.map(settingObj, function(list, group) {
                    return {group: group, list: list};
                });
            },

            applyPrefAppearance: function() {
                let body = window.document.querySelector('body');
                let tsTranslate = window.document.querySelector('ts-translate');
                let fontSizeVal = this.getUserSetting('fontsize').toLowerCase();
                
                tsTranslate.style.fontSize = fontSizeMap[fontSizeVal];
                tsTranslate.style.fontFamily = this.getUserSetting('font');
            },

            applyPrefBehavior: function() {
                console.log('Pretend to apply behavior');
            },

            /**
             * Retreives a value
             * @param key
             * @returns {object}
             */
            getValue: function (key) {
                return getValue(key) || '';
            },

            /**
             * Adds a new value to the configurator
             * @param key: the key used to retreive the value
             * @param value: the value that will be stored
             * @param meta: (optional) parameters to help specify how the value should be treated
             */
            setValue: function (key, value, meta) {
                setValue(key, value, meta);
            },

            /**
             * Loads a configuration object into the configurator
             * @param config a json object (usually loaded from a file)
             */
            loadConfig: function (config) {
                if (storage === undefined) {
                    throw 'Storage is undefined. Please call setStorage with a valid storage object';
                }

                for (let i = 0; i < config.length; i++) {
                    if (config[i].value !== undefined) {
                        if (config[i].meta.mutable) {
                            setDefaultValue(config[i].name, config[i].value);
                        } else {
                            setReadOnlyValue(config[i].name, config[i].value);
                        }
                    }
                }
            },

            /**
             * Destroys a value
             * @param key
             */
            unsetValue: function (key) {
                unsetValue(key);
            },

            /**
             * Clears all values in the configurator
             */
            purgeValues: function () {
                let keys = getKeys();
                for (let i = 0; i < keys.length; i++) {
                    unsetValue(keys[i]);
                }
            }

        };

        return configurator;
    }

    exports.Configurator = Configurator;
})();
