;(function () {
    "use strict";

    function SourceLanguage(parameters) {
        let slug = parameters.code;
        let name = parameters.name;
        let projectName = parameters.projectName;
        let projectDescription = parameters.projectDescription;
        let dateModified = parameters.dateModified;
        let resourceCatalogUrl = parameters.resourceCatalogUrl;
        let resourceCatalogLocalDateModified = parameters.resourceCatalogLocalDateModified;
        let resourceCatalogServerDateModified = parameters.resourceCatalogServerDateModified;
        let direction = parameters.direction;

        let _this = this;

        _this.getSlug = function () {
            return slug;
        };
        _this.getName = function () {
            return name;
        };
        _this.getDirection = function () {
            return direction;
        };
        _this.getProjectTitle = function() {
            return projectName;
        };
        _this.getProjectDescription = function() {
            return projectDescription;
        };
        _this.getDateModified = function () {
            return dateModified;
        };
        _this.getResourceCatalog = function() {
            return resourceCatalogUrl;
        };
        _this.getResourceCatalogLocalDateModified = function () {
            return resourceCatalogLocalDateModified;
        };
        _this.getResourceCatalogServerDateModified = function () {
            return resourceCatalogServerDateModified;
        };

        return _this;
    }

    /**
     * Returns a new instance of a source language
     * @param parameters
     * @returns {SourceLanguage}
     */
    function newInstance(parameters) {
        return new SourceLanguage(parameters);
    }

    exports.newInstance = newInstance;
}());
