;(function () {
    "use strict";

    function TranslationNote(parameters) {
        let slug = parameters.slug;
        let title = parameters.title;
        let body = parameters.body;
        let _this = this;

        _this.getSlug = function() {
            return slug;
        };
        _this.getTitle = function() {
            return title;
        };
        _this.getBody = function() {
            return body;
        };

        return _this;
    }


    /**
     * Returns a new translation note
     * @param parameters
     * @returns {TranslationNote}
     */
    function newInstance(parameters) {
        return new TranslationNote(parameters);
    }

    exports.newInstance = newInstance;
}());
