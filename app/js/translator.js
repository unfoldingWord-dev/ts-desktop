'use strict';

;(function () {

    let fs = require('fs');
    //let path = require('path');
    let rimraf = require('rimraf');
    let TargetTranslation = require('./core/targettranslation');
    //let mkdirp = require('mkdirp');

    function Translator (context, rootPath) {
        //reassign this to _this, set indexId and rootPath
        //let _this = this;

        /** /
        function getLocalCacheDir () {
            return path.join(rootPath, 'cache');
        }
        /**/

        let translator = {

            /**
             * Returns an array of all active target translations
             * @returns {TargetTranslation[]}
             */
            getTargetTranslations: function () {
                let translations = [];
                let filenames = fs.readdirSync(rootPath);
                for (let filename of filenames) {
                    let translation = this.getTargetTranslation(filename);
                    if (translation !== null) {
                        translations.push(translation);
                    }
                }
                return translations;
            },

            /**
             * Creates a new target translation
             * If the target translation already exists not changes will be made
             * @param targetLanguage {TargetLanguage} the target language the project will be translated into
             * @param projectSlug the id of the project that will be translated
             * @returns {TargetTranslation}
             */
            createTargetTranslation: function (targetLanguage, projectSlug) {
                if (typeof targetLanguage === 'undefined' || typeof projectSlug === 'undefined') {
                    return null;
                }
                return TargetTranslation.create(targetLanguage, projectSlug, rootPath);
            },

            /**
             * Deletes a target translation from the disk
             * @param targetTranslationSlug
             */
            deleteTargetTranslation: function(targetTranslationSlug) {
                if(targetTranslationSlug !== null && targetTranslationSlug !== undefined) {
                    let file = TargetTranslation.generateTargetTranslationDir(targetTranslationSlug, rootPath);
                    if(fs.existsSync(file)) {
                        rimraf.sync(file);
                    }
                }
            },

            /**
             * Returns a target translation
             * @param targetTranslationSlug
             * @returns {TargetTranslation}
             */
            getTargetTranslation: function (targetTranslationSlug) {

                if (typeof targetTranslationSlug === 'undefined') {
                    return null;
                }

                let projectSlug = TargetTranslation.getProjectSlugFromSlug(targetTranslationSlug);
                let targetLanguageSlug = TargetTranslation.getTargetLanguageSlugFromSlug(targetTranslationSlug);

                let targetTranslationDir = TargetTranslation.generateTargetTranslationDir(targetTranslationSlug, rootPath);
                if (fs.existsSync(targetTranslationDir)) {
                    return TargetTranslation.newInstance({
                        targetLanguageSlug:targetLanguageSlug,
                        projectSlug:projectSlug,
                        rootDir:rootPath
                    });
                }
                return null;
            },

            /**
             * Returns the root directory to the target translations
             * @returns {string}
             */
            getPath: function () {
                return rootPath;
            }
        };

        return translator;
    }

    exports.Translator = Translator;
}());
