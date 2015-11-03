;(function () {
    "use strict";

    let path = require('path');
    let fs = require('fs');
    let FrameTranslation = require('./frametranslation');

    const GLOBAL_PROJECT_SLUG = 'uw';
    const MANIFEST_VERSION = 2;

    function TargetTranslation(parameters) {
        let targetLanguageSlug = parameters.targetLanguageSlug;
        let projectSlug = parameters.projectSlug;
        let targetTranslationDirectory = generateTargetTranslationDir(generateTargetTranslationSlug(targetLanguageSlug, projectSlug), parameters.rootDir);
        let manifestPath = path.join(targetTranslationDirectory, 'manifest.json');
        let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        let targetLanguageName = targetLanguageSlug;
        try {
            targetLanguageName = manifest['target_language']['name'];
        } catch (e) {}
        let targetLanguageDirection = 'ltr';
        try {
            targetLanguageDirection = manifest['target_language']['direction'];
        } catch (e) {}

        let _this = this;

        _this.getSlug = function() {
            return generateTargetTranslationSlug(targetLanguageSlug, projectSlug);
        };
        _this.getTargetLanguageName = function() {
            return targetLanguageName;
        };
        _this.getTargetLanguageDirection = function() {
            return targetLanguageDirection;
        };
        _this.getTargetLanguageSlug = function() {
            return targetLanguageSlug;
        };
        _this.getProjectSlug = function() {
            return projectSlug;
        };
        /**
         * Returns the directory of this target translation
         * @returns {string}
         */
        _this.getPath = function() {
            return targetTranslationDirectory;
        };
        _this.getFrameTranslation = function(chapterSlug, frameSlug, translationFormat) {
            let file = path.join(targetTranslationDirectory, chapterSlug, frameSlug + '.txt');
            if(fs.existsSync(file)) {
                let body = fs.readFileSync(file);
                return FrameTranslation.newInstance({
                    body:body,
                    chapterSlug:chapterSlug,
                    translationFormat:translationFormat,
                    frameSlug:frameSlug,
                    finished:isFrameFinished(chapterSlug + '-' + frameSlug),
                });
            }
            // give empty translation
            return FrameTranslation.newInstance({
                body:'',
                chapterSlug:chapterSlug,
                translationFormat:translationFormat,
                frameSlug:frameSlug,
                finished:false,
            });
        };
        return _this;
    }

    /**
     * Checks if the translation of a frame is complete
     * @param complexFrameId
     * @returns {boolean}
     */
    function isFrameFinished(complexFrameId) {
        complexFrameId = complexFrameId;
        // TODO: check the target translation manifest to see if the frame is complete.
        return false;
    }

    /**
     * Returns a new target translation
     * @param parameters
     * @returns {TargetTranslation}
     */
    function newInstance(parameters) {
        return new TargetTranslation({targetLanguageSlug: parameters});
    }

    /**
     * Returns the project slug
     * @param targetTranslationSlug
     * @returns {string}
     */
    function getProjectSlugFromSlug (targetTranslationSlug) {
        let complexId = targetTranslationSlug.split('-', 3);
        if(complexId.length === 3) {
            return complexId[1];
        } else {
            throw new Error('malformed target translation slug ' + targetTranslationSlug);
        }
    }

    /**
     * Returns the target language slug
     * @param targetTranslationSlug
     * @returns {string}
     */
    function getTargetLanguageSlugFromSlug (targetTranslationSlug) {
        let complexId = targetTranslationSlug.split('-');
        if(complexId.length >= 3) {
            // TRICKY: target language id's can have dashes in them
            let sourceLanguageId = complexId[2];
            for(var i = 3; i < complexId.length; i ++) {
                sourceLanguageId += "-" + complexId[i];
            }
            return sourceLanguageId;
        } else {
            throw new Error('malformed target translation id ' + targetTranslationSlug);
        }
    }

    /**
     * Returns the path to the target translation directory
     * @param targetTranslationSlug
     * @param rootDir the root directory where target translations are stored
     * @returns {string}
     */
    function generateTargetTranslationDir(targetTranslationSlug, rootDir) {
        return path.join(rootDir, targetTranslationSlug);
    }

    /**
     * Returns a properly formatted target translation slug
     * @param targetLanguageSlug
     * @param projectSlug
     * @returns {string}
     */
    function generateTargetTranslationSlug(targetLanguageSlug, projectSlug) {
        return GLOBAL_PROJECT_SLUG + '-' + projectSlug + '-' + targetLanguageSlug;
    }

    /**
     * Creates a new target translation
     * If the target translation already exists the existing one will be returned
     *
     * @param targetLanguage {TargetLanguage} the target language the project will be translated into
     * @param projectSlug the id of the project that will be translated
     * @param rootDir the parent directory in which the target translation directory will be created
     * @returns {TargetTranslation}
     */
    function create(targetLanguage, projectSlug, rootDir) {
        let targetTranslationDir = generateTargetTranslationDir(generateTargetTranslationSlug(targetLanguage.getSlug(), projectSlug), rootDir);
        if(!fs.existsSync(targetTranslationDir)) {
            // build new target translation
            fs.mkdirSync(targetTranslationDir);
            let manifestJson = {
                generator: {
                    name: 'ts-desktop',
                    build: '' // todo get app build number
                },
                package_version: MANIFEST_VERSION,
                target_language: {
                    direction: targetLanguage.getDirection(),
                    id: targetLanguage.getSlug(),
                    name: targetLanguage.getName()
                },
                project_id: projectSlug,
                source_languages: {}
            };
            fs.writeFileSync(path.join(targetTranslationDir, 'manifest.json'), JSON.stringify(manifestJson));
        }
        // load the target translation (new or otherwise)
        return TargetTranslation.newInstance({
            targetLanguageSlug:targetLanguage.getSlug(),
            projectSlug:projectSlug,
            rootDir:rootDir
        });
    }

    exports.create = create;
    exports.generateTargetTranslationDir = generateTargetTranslationDir;
    exports.getProjectSlugFromSlug = getProjectSlugFromSlug;
    exports.getTargetLanguageSlugFromSlug = getTargetLanguageSlugFromSlug;
    exports.newInstance = newInstance;
}());
