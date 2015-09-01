'use strict';

;(function () {

    let Configurator = require('./configurator').Configurator,
        configurator = new Configurator(),
        lang = require('./lib/languages');

    /**
     *  Library module handles sourceTranslation (projects, e.g. Genesis, OBS)
     *  Translator module handles creation targetTranslation (e.g., uw-gen-en)
     *  uw-gen-en
     *  uw-obs-de
     */

    function Translator (appIndex) {

        let translator = {
            get projects () {
                return [];
            },

            get targetLanguages () {
                return lang.list();
            },

            createTargetTranslation: function () {

            }
        };

        return translator;
    }

    exports.Translator = Translator;
}());
