;(function () {
    "use strict";

    function ProjectCategory(parameters) {
        var title = parameters.title;
        var categorySlug = parameters.categorySlug;
        var projectSlug = parameters.projectSlug;
        var sourceLanguageSlug = parameters.sourceLanguageSlug;
        var parentCategoryId = parameters.parentCategoryId;
        let _this = this;

        /**
         * Returns the project category id
         *
         * This is different from the category id and the project id.
         * This id will uniquely identify this ProjectCategory from all categories and projects.
         *
         * @returns {string}
         */
        _this.getId = function() {
            if(projectSlug !== null) {
                return 'cat-' + projectSlug;
            } else {
                return categorySlug;
            }
        };
        /**
         * Checks if this category represents a single project
         * If this returns false then one or more projects are categorized under this category
         * @returns {boolean}
         */
        _this.isProject = function() {
            return projectSlug !== null;
        };
        _this.getTitle = function() {
            return title;
        };
        _this.getCategoryId = function() {
            return categorySlug;
        };
        _this.getProjectSlug = function() {
            return projectSlug;
        };
        _this.getSourceLanguageSlug = function() {
            return sourceLanguageSlug;
        };
        /**
         *
         * @returns {int}
         */
        _this.getParentCategoryId = function() {
            return parentCategoryId;
        };

        return _this;
    }


    /**
     * Returns a new project category
     * @param parameters
     * @returns {ProjectCategory}
     */
    function newInstance(parameters) {
        return new ProjectCategory(parameters);
    }

    exports.newInstance = newInstance;
}());
