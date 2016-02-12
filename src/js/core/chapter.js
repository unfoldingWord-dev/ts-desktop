;(function () {
    "use strict";

    function Chapter(parameters) {
        var slug = parameters.slug;
        var title = parameters.title;
        var reference = parameters.reference;
        let _this = this;

        _this.getSlug = function() {
            return slug;
        };
        _this.getTitle = function() {
            return title;
        };
        _this.getReference = function() {
            return reference;
        };

        return _this;
    }


    /**
     * Returns a new chapter
     * @param parameters
     * @returns {Chapter}
     */
    function newInstance(parameters) {
        return new Chapter(parameters);
    }

    exports.newInstance = newInstance;
}());
