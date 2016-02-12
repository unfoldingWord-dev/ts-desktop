'use strict';

let fs = require('fs');
let path = require('path');
let jsonfile = require('jsonfile');
let _ = require('lodash');
let locale2 = new require('locale');

/**
 * Loads the i18n dictionary from the library.
 * The default local will provide a fallback for missing locale
 * @param dir the directory where locale definitions are stored
 * @param locale {Locale}
 * @param defaultLocale the fallback locale to use is a translation is missing
 * @returns {*}
 */
function loadLocale (dir, locale, defaultLocale) {
    if (dir !== '' && locale !== null) {
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

/**
 *  Returns the supported locales
 * @param dir the directory where locale definitions are stored
 * @returns {Locales}
 */
function supportedLocales (dir) {
    let localLocales = [];
    _.forEach(fs.readdirSync(dir), function(n) {
        localLocales.push(n.replace(/\.[^/.]+$/, ''));
    });
    return new locale2.Locales(localLocales);
}

/**
 * @param dir the directory where the locale definitions are stored
 * @param code the locale code
 * @param {Locale}
 */
function chooseBestLocale(dir, code) {
    let defaultLocale = new locale2.Locales(code || 'en');
    return defaultLocale.best(supportedLocales(dir));
}

/**
 *
 * @param dir the directory where locale definitions are stored
 * @param defaultLocaleCode {string} the locale to fall back to if we are missing a translation
 * @returns {{_: i18n._, setLocale: i18n.setLocale, getLocale: i18n.getLocale}}
 * @constructor
 */
function Locale (dir, defaultLocaleCode) {
    let dictionary = {};
    let defaultLocale = chooseBestLocale(dir, defaultLocaleCode);
    let locale = defaultLocale;
    dictionary = loadLocale(dir, locale, defaultLocale);

    let i18n = {
        /**
         * Returns the localized value.
         * If no value is found it will log the missing key in the console
         * @param key
         * @returns {string} an empty string if the localization does not exist
         * @private
         */
        _: function (key) {
            if (Object.keys(dictionary).length > 0) {
                if (dictionary.hasOwnProperty(key)) {
                    return dictionary[key];
                }
            }
            console.log('i18n: Missing localization for key "' + key + '"');
            return '[i18n: ' + key + ']';
        },

        /**
         * Changes the active locale
         * The default locale will be used if this locale is missing translations
         * @param code
         */
        setLocale: function (code) {
            locale = chooseBestLocale(dir, code);
            dictionary = loadLocale(dir, locale, defaultLocale);
        },

        /**
         * Returns the locale code
         * @returns {string}
         */
        getLocale: function () {
            return locale;
        },

        /**
         * Returns the dictionary for the localization
         * @returns {{}}
         */
        get dictionary() {
            return dictionary;
        }
    };

    return i18n;
}

module.exports.Locale = Locale;
