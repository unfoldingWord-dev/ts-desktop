;(function () {
    "use strict";

    function Project(parameters) {
        let slug = parameters.slug;
        let sourceLanguageSlug = parameters.sourceLanguageSlug;
        let name = parameters.name;
        let description = parameters.description;
        let dateModified = parameters.dateModified;
        let sort = parameters.sort;
        let sourceLanguageCatalog = parameters.sourceLanguageCatalog;
        let sourceLanguageCatalogLocalDateModified = parameters.sourceLanguageCatalogLocalModifiedAt;
        let sourceLanguageCatalogServerDateModified = parameters.sourceLanguageCatalogServerModifiedAt;

        let _this = this;

        _this.getSlug = function () {
            return slug;
        };
        _this.getSourceLanguageSlug = function () {
            return sourceLanguageSlug;
        };
        _this.getName = function () {
            return name;
        };
        _this.getDescription = function () {
            return description;
        };
        _this.getSort = function () {
            return sort;
        };
        _this.getSourceLanguageCatalogUrl = function () {
            return sourceLanguageCatalog;
        };
        _this.getSourceLanguageCatalogLocalDateModified = function () {
            return sourceLanguageCatalogLocalDateModified;
        };
        _this.getSourceLanguageCatalogServerDateModified = function () {
            return sourceLanguageCatalogServerDateModified;
        };
        _this.getDateModified = function () {
            return dateModified;
        };

        return _this;
    }

    /**
     * Returns a new instance of a project
     * @param parameters
     * @returns {Project}
     */
    function newInstance(parameters) {
        return new Project(parameters);
    }

    exports.newInstance = newInstance;
}());
