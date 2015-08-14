
var fs = require('fs');
var path = require('path');
var jsonfile = require('jsonfile');

;(function () {
    'use strict';

    /**
     * Merges the properties of obj1 and obj2 properties in obj2 will overide duplicate properties in obj1
     * @param obj1
     * @param obj2
     */
    function mergeObjects (obj1, obj2) {
        var obj3 = {};
        for (var prop1 in obj1) {
            if (obj1.hasOwnProperty(prop1)) {
                obj3[prop1] = obj1[prop1];
            }
        }
        for (var prop2 in obj2) {
            if (obj2.hasOwnProperty(prop2)) {
                obj3[prop2] = obj2[prop2];
            }
        }
        return obj3;
    }

    /**
     * Loads the i18n dictionary from the library.
     * The default local will provide a fallback for missing locale
     * @param locale
     * @returns {*}
     */
    function loadLocale (dir, locale, defaultLocale) {
        if (dir !== '' && locale !== '') {
            var dictionaryPath = path.join(dir, locale + '.json');
            var defaultDictionaryPath = path.join(dir, defaultLocale + '.json');
            var defaultDict = {};
            var dict = {};
            if (fs.existsSync(defaultDictionaryPath)) {
                defaultDict = jsonfile.readFileSync(defaultDictionaryPath);
            }
            if (fs.existsSync(dictionaryPath)) {
                dict = jsonfile.readFileSync(dictionaryPath);
            }
            return mergeObjects(defaultDict, dict);
        }
        return {};
    }

    function Locale (dir, defaultLocaleCode) {
        let dictionary = {};
        let defaultLocale = defaultLocaleCode || 'en';
        let locale = defaultLocale;
        let libraryDir = dir;
        dictionary = loadLocale(libraryDir, locale, defaultLocale);

        let i18n = {
            /**
             * Returns the localized value
             * @param key
             * @returns {*}
             * @private
             */
            _: function (key) {
                if (Object.keys(dictionary).length > 0) {
                    if (dictionary.hasOwnProperty(key)) {
                        return dictionary[key];
                    }
                }
                return '[i18n: ' + key + ']';
            },
            /**
             * Changes the active locale
             * @param code
             */
            setLocale: function (code) {
                locale = code;
                dictionary = loadLocale(libraryDir, locale, defaultLocale);
            },
            /**
             * Returns the locale code
             * @returns {string}
             */
            getLocale: function () {
                return locale;
            }
        };

        return i18n;
    }

    exports.Locale = Locale;
}());
