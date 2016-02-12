;(function () {
    "use strict";

    function SourceTranslation(parameters) {
        let projectSlug = parameters.projectSlug;
        let sourceLanguageSlug = parameters.sourceLanguageSlug;
        let resourceSlug = parameters.resourceSlug;
        let projectTitle = parameters.projectTitle;
        let sourceLanguageTitle = parameters.sourceLanguageTitle;
        let resourceTitle = parameters.resourceTitle;
        let checkingLevel = parameters.checkingLevel;
        let dateModified = parameters.dateModified;
        let version = parameters.version;
        let _this = this;

        _this.getProjectSlug = function () {
            return projectSlug;
        };
        _this.getSourceLanguageSlug = function () {
            return sourceLanguageSlug;
        };
        _this.getResourceSlug = function () {
            return resourceSlug;
        };
        _this.getProjectTitle = function () {
            return projectTitle;
        };
        _this.getSourceLanguageTitle = function () {
            return sourceLanguageTitle;
        };
        _this.getResourceTitle = function () {
            return resourceTitle;
        };
        _this.getCheckingLevel = function () {
            return checkingLevel;
        };
        _this.getDateModified = function () {
            return dateModified;
        };
        _this.getVersion = function () {
            return version;
        };

        return _this;
    }


    /**
     * Returns a new source translation.
     * This is a simple version that only includes the slugs
     * @param projectSlug
     * @param sourceLanguageSlug
     * @param resourceSlug
     */
    function simpleInstance(projectSlug, sourceLanguageSlug, resourceSlug) {
        return new SourceTranslation({
            projectSlug: projectSlug,
            sourceLanguageSlug: sourceLanguageSlug,
            resourceSlug: resourceSlug,
            projectTitle: "",
            sourceLanguageTitle: "",
            resourceTitle: "",
            checkingLevel: 0,
            dateModified: 0,
            version: "0.0.0"
        });
    }

    /**
     * Returns the project slug
     * @param sourceTranslationId
     * @returns {*}
     */
    function getProjectIdFromId (sourceTranslationId) {
        let complexId = sourceTranslationId.split('-', 3);
        if(complexId.length === 3) {
            return complexId[0];
        } else {
            throw new Error('malformed source translation id ' + sourceTranslationId);
        }
    }

    /**
     * Returns the source language slug
     * @param sourceTranslationId
     * @returns {*}
     */
    function getSourceLanguageIdFromId (sourceTranslationId) {
        let complexId = sourceTranslationId.split('-');
        if(complexId.length >= 3) {
            // TRICKY: source language id's can have dashes in them
            let sourceLanguageId = complexId[1];
            for(var i = 2; i < complexId.length - 1; i ++) {
                sourceLanguageId += "-" + complexId[i];
            }
            return sourceLanguageId;
        } else {
            throw new Error('malformed source translation id ' + sourceTranslationId);
        }
    }

    /**
     * Returns the resource slug
     * @param sourceTranslationId
     * @returns {*}
     */
    function getResourceIdFromId (sourceTranslationId) {
        let complexId = sourceTranslationId.split('-');
        if(complexId >= 3) {
            return complexId[complexId.length - 1];
        } else {
            throw new Error('malformed source translation id ' + sourceTranslationId);
        }
    }

    /**
     * Returns a new source translation
     * @param parameters
     * @returns {SourceTranslation}
     */
    function newInstance(parameters) {
        return new SourceTranslation(parameters);
    }

    exports.newInstance = newInstance;
    exports.simpleInstance = simpleInstance;
    exports.getProjectSlugFromSlug = getProjectIdFromId;
    exports.getSourceLanguageSlugFromSlug = getSourceLanguageIdFromId;
    exports.getResourceSlugFromSlug = getResourceIdFromId;
}());
