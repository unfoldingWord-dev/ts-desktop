;(function () {
    "use strict";

    function Frame(parameters) {
        let slug = parameters.slug;
        let chapterSlug = parameters.chapterSlug;
        let body = parameters.body;
        let translationFormat = parameters.translationFormat;
        let imageUrl = parameters.imageUrl;
        let dbId = -1;
        let _this = this;

        _this.getSlug = function() {
            return slug;
        };
        _this.getChapterSlug = function() {
            return chapterSlug;
        };
        _this.getBody = function() {
            return body;
        };
        _this.getTranslationFormat = function() {
            return translationFormat;
        };
        _this.getImageUrl = function() {
            return imageUrl;
        };
        /**
         * Sets the database id of this frame
         * @param id
         */
        _this.setDBId = function(id) {
            dbId = id;
        };

        return _this;
    }

    /**
     * Returns a new frame
     * @param parameters
     * @returns {Frame}
     */
    function newInstance(parameters) {
        return new Frame(parameters);
    }

    exports.newInstance = newInstance;
}());
