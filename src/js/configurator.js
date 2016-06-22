/**
 * ts.Configurator
 * settings manager that uses local storage by default, but can be overridden to use any storage provider.
 * Configurations are stored by key as stringified JSON (meta includes type, mutability, etc)
 */

;(function () {
    'use strict';

    let _ = require('lodash');
    let path = require('path');
    let untildify = require('untildify');
    let userSetting = require('../config/user-setting');

    function Configurator () {
        let storage = {};

        let getValue = function (key) {
            if (key === undefined) {
                return key;
            }
            key = key.toLowerCase();

            let valueObjStr = storage[key] || '{}';
            let valueObj = JSON.parse(valueObjStr);
            let metaObj = valueObj.meta || {'default': ''};

            //load value
            let value = valueObj.value;

            //otherwise use default (if present)
            if (value === undefined && metaObj.default) {
                value = metaObj.default;
            }

            return value;
        };

        let getMetaValue = function (key, metaKey) {
            if (key === undefined) {
                return key;
            }
            key = key.toLowerCase();

            let valueObjStr = storage[key] || '{}';
            let valueObj = JSON.parse(valueObjStr);

            return valueObj.meta ? valueObj.meta[metaKey] : '';
        };

        let setValue = function (key, value, meta) {
            if (key === undefined || value === undefined) {
                return;
            }
            key = key.toLowerCase();
            value = (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'object') ? value : value.toString();

            //load value object or create new empty value object
            let emptyStorageObj = {'value': value, 'meta': {'mutable': true, 'type': typeof value, 'default': ''}};
            let valueObj = storage[key] !== undefined ? JSON.parse(storage[key]) : emptyStorageObj;

            //update value
            valueObj.value = value;

            //update meta
            valueObj.meta = _.merge(valueObj.meta, meta);

            //update value in storage
            storage[key] = JSON.stringify(valueObj);

        };

        let unsetValue = function (key) {
            if (key === undefined) {
                return;
            }
            key = key.toLowerCase();

            //remove value from storage
            if (typeof storage.removeItem === 'function') {
                storage.removeItem(key);
            } else {
                storage[key] = undefined;
            }
        };

        let setDefaultValue = function (key, value) {
            setValue(key, value, {'default': value || ''});
        };

        let getKeys = function () {
            return Object.keys(storage);
        };

        /**
         * Map the raw setting array into groups and lists for UI to display
         * @param settingArr: array of setting objects
         * @param groupOrder: (optional) array of string of group name
         * @return array of setting-group objects
         */
        let mapUserSettings = function(settingArr, groupOrder) {
            // TODO: Order group
            var grouped = _.groupBy(settingArr, 'group');
            return _.map(grouped, function (list, group) {
                return { group, list };
            });
        };

        /**
         */
        let flattenUserSetting = function(settingArr) {
            var flatSetting = [];

            settingArr.forEach(function(groupObj) {
                groupObj.list.forEach(function(setting) {
                    flatSetting.push(setting);
                });
            });

            return flatSetting;
        };

        /**
         */
        let fontSizeMap = {
            'small': '50%',
            'normal': '100%',
            'large': '150%'
        };


        //
        // This is the returned object
        //
        let configurator = {

            /**
             */
            get PATH_SEP() {
                return path.sep;
            },

            /**
             * Fetch the raw and default setting array from JSON file
             * @return setting array from user-setting.json
             */
            _userSetting: function() {
                return userSetting;
            },

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
             * Fetch the (mapped) setting array
             * @return setting array from user's storage or from default file
             */
            getUserSettingArr: function() {
                var us;
                try {
                    us = JSON.parse(storage['user-setting']);
                } catch (e) { console.error(e); }
                return us || mapUserSettings(this._userSetting());
            },

            /**
             * Write the whole (mapped) setting array to the user's preferred storage
             * @param settingArr
             */
            saveUserSettingArr: function(settingArr) {
                storage['user-setting'] = JSON.stringify(settingArr);
            },

            /**
             * Get the value of a setting
             * @param name: of the user setting
             * @return value of the user setting
             */
            getUserSetting: function(name) {
                try {
                    var s = this.getUserSettingArr();
                    var list = _.find(s, {'list': [{'name': name}]}).list;
                    return _.find(list, {'name': name}).value;
                } catch (e) { console.error(e); }
            },

            // TODO: this needs to be refactored. This is due to needing the backup dirs in the UI side.
            //  This might be an okay solution, but it needs to be examined.
            getUserPath: function (key, arg1, arg2, arg3) {
                var val = configurator.getUserSetting(key);

                return val ? path.join(untildify(val), arg1 || '', arg2 || '', arg3 || '') : '';
            },

            /**
             * Set the value of a setting
             * @param name: of the user setting
             * @return value of the user setting
             */
            setUserSetting: function(name, value) {
                try {
                    var s = this.getUserSettingArr();
                    var listIndex = _.findIndex(s, {'list': [{'name': name}]});
                    var settingIndex = _.findIndex(s[listIndex].list, {'name': name});
                    s[listIndex].list[settingIndex].value = value;
                    this.saveUserSettingArr(s);
                    return s;
                } catch (e) { console.error(e); }
            },

            /**
             */
            refreshUserSetting: function() {
                var defaults = this._userSetting();
                var current = [];

                try {
                    current = flattenUserSetting(JSON.parse(storage['user-setting']));
                } catch (e) {
                    console.info('No user settings');
                }

                // Keep current values and remove non-existent settings
                for (var i in current) {
                    var j = _.findIndex(defaults, {'name': current[i].name});
                    if (j >= 0) {
                        defaults[j].value = current[i].value;
                    }
                }

                let mappedSettings = mapUserSettings(defaults);
                this.saveUserSettingArr(mappedSettings);
                return mappedSettings;
            },

            /**
             * Apply user preferences for app's look
             */
            applyPrefAppearance: function() {
                var targetfont = this.getUserSetting('targetfont').name;
                var sourcefont = this.getUserSetting('sourcefont').name;
                var fontSizeVal = this.getUserSetting('targetsize').name.toLowerCase();
                var fontSize = fontSizeMap[fontSizeVal];
                var sheet = document.styleSheets[0];
                var rules = sheet.cssRules;

                for (var i = 0; i < rules.length; i++) {
                    if (rules[i].selectorText.toLowerCase() === ".targetfont" || rules[i].selectorText.toLowerCase() === ".sourcefont") {
                        sheet.deleteRule(i);
                        i--;
                    }
                }

                sheet.insertRule(".targetfont {font-family: " + targetfont + "}", 0);
                sheet.insertRule(".targetfont {font-size: " + fontSize + "}", 1);
                sheet.insertRule(".sourcefont {font-family: " + sourcefont + "}", 2);
                sheet.insertRule(".sourcefont {font-size: " + fontSize + "}", 3);

            },

            /**
             *
             */
            applyPrefBehavior: function() {
                // We may not need this as settings that affects behavior is most likely called
                //    using the App.configurator.getUserSetting(key) API.
                // console.log('Pretend to apply behavior');
            },

            /**
             *
             */
            getAppData: function() {
                try {
                    let p = require('../../package');
                    return {version: p.version, build: p.build};
                } catch (e) { console.log(e); }
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
                    setDefaultValue(config[i].name, config[i].value);
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
