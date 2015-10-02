'use strict';

;(function () {

    let fs = require('fs');
    let path = require('path');
    let jsonfile = require('jsonfile');
    let _ = require('lodash');

    /**
     * Loads the i18n dictionary from the library.
     * The default local will provide a fallback for missing locale
     * @param locale
     * @returns {*}
     */
    function loadLocale (dir, locale, defaultLocale) {
        if (dir !== '' && locale !== '') {
            let dictionaryPath = path.join(dir, locale + '.json');
            let defaultDictionaryPath = path.join(dir, defaultLocale + '.json');
            let defaultDict = {};
            let dict = {};
            if (fs.existsSync(defaultDictionaryPath)) {
                defaultDict = jsonfile.readFileSync(defaultDictionaryPath);
            }
            if (fs.existsSync(dictionaryPath)) {
                dict = jsonfile.readFileSync(dictionaryPath);
            }
            return _.merge(defaultDict, dict);
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
