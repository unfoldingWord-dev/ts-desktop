'use strict';

;(function () {

    let fs = require('fs');
    let path = require('path');
    let mkdirp = require('mkdirp');
    let rimraf = require('rimraf');

    function Translator (context, rootPath) {

        //reassign this to _this, set indexId and rootPath
        let _this = this;
        _this.context = context;
        _this.rootPath = rootPath;

        function getTargetTranslationId (targetLanguageId, projectId) {
            return 'uw-' + projectId + '-' + targetLanguageId.replace(/\-/g, '_');
        }

        function getProjectIdFromId (targetTranslationId) {
            let idParts = split('-');
            if (idParts.length === 3) {
                return idParts[1];
            }
            return null;
        }

        function getTargetLanguageIdFromId (targetTranslationId) {
            let idParts = split('-');
            if (idParts.length === 3) {
                return idParts[2].replace(/\_/g, '-');
            }
            return null;
        }

        function getTargetTranslationDir (targetTranslationId) {
            return path.join(_this.rootPath, targetTranslationId);
        }

        function getLocalCacheDir () {
            return path.join(_this.rootPath, 'cache');
        }

        let translator = {

            getTargetTranslations: function () {
                let translations = [];
                let filenames = fs.readdirSync(_this.rootPath);
                for (let filename of filenames) {
                    let translation = getTargetTranslation(filename);
                    if (translation !== null) {
                        translations.push(translation);
                    }
                }
                return translations;
            },

            createTargetTranslation: function (targetLanguageId, projectId) {

                if (typeof targetLanguageId === 'undefined' || typeof projectId === 'undefined') {
                    return null;
                }

                let targetTranslationId = getTargetTranslationId(targetLanguageId, projectId);
                let targetTranslationDir = getTargetTranslationDir(targetTranslationId);

                if (!fs.existsSync(targetTranslationDir)) {
                    fs.mkdirSync(targetTranslationDir);

                    //IDK how we get any of these values
                    let targetLanguageDirection = 'ltr';
                    let targetLanguageName = '';
                    let sourceLanguages = {};
                    let build = '';
                    let packageVersion = 2;

                    let manifestJson = {
                        generator: {
                            name: 'ts-desktop',
                            build: '???'
                        },
                        package_version: packageVersion,
                        target_language: {
                            direction: targetLanguageDirection,
                            id: targetLanguageId,
                            name: targetLanguageName
                        },
                        project_id: projectId,
                        source_languages: sourceLanguages
                    };
                    fs.writeFileSync(path.join(targetTranslationDir, 'manifest.json'), JSON.stringify(manifestJson));

                    let translationsJson = fs.readFileSync(path.join(_this.rootPath, 'translations.json'));
                    let translations = JSON.parse(translationsJson);
                    if (!Array.isArray(translations)) {
                        translations = [];
                    }
                    translations.push({
                        target_language_id: targetLanguageId,
                        project_id: projectId
                    });
                    fs.writeFileSync(path.join(_this.rootPath, 'translations.json'), JSON.stringify(translations));
                }

                return getTargetTranslation(targetTranslationId);
            },

            getTargetTranslation: function (targetTranslationId) {

                if (typeof targetTranslationId === 'undefined') {
                    return null;
                }

                let projectId = getProjectIdFromId(targetTranslationId);
                let targetLanguageId = getTargetLanguageIdFromId(targetTranslationId);
                let targetTranslationDir = getTargetTranslationDir(targetTranslationId);

                let targetLanguageDirection = '';
                let targetLanguageName = '';

                if (!fs.existsSync(targetTranslationDir)) {
                    return null;
                }

                //build return object
                let returnObj = {
                    getPath: function () {
                        return targetTranslationDir;
                    },
                    getTargetLanguageDirection: function () {
                        return targetLanguageDirection;
                    },
                    getId: function () {
                        return targetTranslationId;
                    },
                    getTargetLanguageName: function () {
                        return targetLanguageName;
                    }
                    getProjectId: function () {
                        return projectId;
                    },
                    getTargetLanguageId: function () {
                        return targetLanguageId;
                    },
                    getFrameTranslation: function (chapterId, frameId, format) {
                        let file = path.join(targetTranslationDirectory, chapterId, frameId + '.txt');
                        if (!fs.existsSync(file)) {
                            return null;
                        }
                        let body = fs.readFileSync(file);
                        //return ???
                    },
                    getChapterTranslation: function (chapterSlug) {
                        chapterSlug;
                    }
                };

                return returnObj;
            }
        };

        return translator;
    }

    exports.Translator = Translator;
}());
