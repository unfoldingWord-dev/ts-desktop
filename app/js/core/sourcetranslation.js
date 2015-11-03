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

    exports.simpleInstance = simpleInstance;
}());
