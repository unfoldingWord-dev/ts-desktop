;(function () {
    "use strict";

    function CheckingQuestion(parameters) {
        let slug = parameters.slug;
        let chapterSlug = parameters.chapterSlug;
        let frameSlug = parameters.frameSlug;
        let question = parameters.question;
        let answer = parameters.answer;
        let references = parameters.references;
        let _this = this;

        _this.getSlug = function() {
            return slug;
        };
        _this.getChapterSlug = function() {
            return chapterSlug;
        };
        _this.getFrameSlug = function() {
            return frameSlug;
        };
        _this.getQuestion = function() {
            return question;
        };
        _this.getAnswer = function() {
            return answer;
        };
        _this.getReferences = function() {
            return references;
        };
        return _this;
    }


    /**
     * Returns a new checking question
     * @param parameters
     * @returns {CheckingQuestion}
     */
    function newInstance(parameters) {
        return new CheckingQuestion(parameters);
    }

    exports.newInstance = newInstance;
}());
