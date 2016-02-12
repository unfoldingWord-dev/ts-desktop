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
        /**
         * Returns an array of references
         * @returns {Reference[]}
         */
        _this.getReferences = function() {
            return references;
        };
        return _this;
    }

    function Reference (chapterSlug, frameSlug) {
        let reference = chapterSlug + '-' + frameSlug;
        let _this = this;

        _this.getReference = function() {
            return reference;
        };
        _this.getChapterSlug = function() {
            return chapterSlug;
        };
        _this.getFrameSlug = function() {
            return frameSlug;
        };
    }

    /**
     * Generates a new refernce
     * @param reference
     * @returns {Reference}
     */
    function generateReference (reference) {
        if(reference === null || reference === undefined) {
            throw new Error('The reference must not be null');
        }
        let complexId = reference.split('-');
        if(complexId.length === 2) {
            return new Reference(complexId[0], complexId[1]);
        } else {
            throw new Error('The reference "' + reference + '" is invalid');
        }
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
    exports.Reference = Reference;
    exports.generateReference = generateReference;
}());
