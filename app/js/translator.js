// translator module

;(function () {
    'use strict';

    let Configurator = require('./configurator').Configurator,
        configurator = new Configurator(),
        lang = require('./lib/languages');


    configurator = configurator; // supress lint errors
    /**
     *  Library module handles sourceTranslation (projects, e.g. Genesis, OBS)
     *  Translator module handles creation targetTranslation (e.g., uw-gen-en)
     *  uw-gen-en
     *  uw-obs-de
     */

    function Translator (appIndex) {
        appIndex = appIndex; // supress lint errors
        let translator = {

            get targetLanguages () {
                return lang.list();
            },

            createTargetTranslation: function () {

            },

            get targetTranslations () {
                return [];
            }
        };

        return translator;
    }

    exports.Translator = Translator;
}());
