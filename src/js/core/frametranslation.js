;(function () {
    "use strict";

    function Frame(parameters) {
        let body = parameters.body;
        let chapterSlug = parameters.chapterSlug;
        let translationFormat = parameters.translationFormat;
        let frameSlug = parameters.frameSlug;
        let finished = parameters.finished;
        let verses = null;
        let _this = this;

        /**
         * Returns the frame slug
         * @returns {string}
         */
        _this.getSlug = function() {
            return frameSlug;
        };

        _this.getChapterSlug = function() {
            return chapterSlug;
        };

        /**
         * Returns the frame body
         * @returns {string}
         */
        _this.getBody = function() {
            return body;
        };

        /**
         * Returns the translation format of the frame body
         * @returns {*}
         */
        _this.getTranslationFormat = function() {
            return translationFormat;
        };

        /**
         * Checks if the translation is finished
         * @returns {boolean}
         */
        _this.isFinished = function() {
            return finished;
        };

        /**
         * Returns the title of the frame translation
         */
        _this.getTitle = function() {
            if(translationFormat === 'usx') {
                // get the verse range
                let verses = _this.getBodyVerseRange();
                if(verses.length === 1) {
                    return verses[0] + '';
                } else if(verses.length === 2) {
                    return verses[0] + '-' + verses[1];
                } else {
                    return parseInt(frameSlug) + '';
                }
            }
             else {
                return parseInt(frameSlug) + '';
            }
        };
        /**
         * Returns the range of verses that the body spans
         * @return {int[]} int[0] if no verses, int[1] if one verse, int[2] if a range of verses
         */
        _this.getBodyVerseRange = function() {
            if(verses === null) {
                verses = getVerseRange(body);
            }
            return verses;
        };

        /**
         * Returns the formatted beginning verse in this frame
         * @returns {string}
         */
        _this.getStartVerse = function() {
            if(translationFormat === 'usx') {
                // get verse range
                let verses = _this.getBodyVerseRange();
                if(verses.length > 0) {
                    return verses[0] + '';
                }
            }
            return parseInt(frameSlug) + '';
        };

        /**
         * Returns the formatted ending verse for this frame.
         * @returns {string}
         */
        _this.getEndVerse = function() {
            if(translationFormat === 'usx') {
                // get verse range
                let verses = _this.getBodyVerseRange();
                if(verses.length === 1) {
                    return verses[0] + '';
                } else if(verses.length === 2) {
                    return verses[1] + '';
                }
            }
            return parseInt(frameSlug) + '';
        };

        /**
         * Returns the complex chapter-frame slug
         * @returns {string}
         */
        _this.getComplexSlug = function() {
            return chapterSlug + '-' + frameSlug;
        };

        return _this;
    }

    /**
     * Returns the range of verses that a chunk of text spans
     * @param body
     * @return {int[]} int[0] if no verses, int[1] if one verse, int[2] if a range of verses
     */
    function getVerseRange(body) {
        body = body;
        // todo parse body and look for verses
        return [];
    }

    /**
     * Returns a new frame translation
     * @param parameters
     * @returns {Frame}
     */
    function newInstance(parameters) {
        return new Frame(parameters);
    }

    exports.newInstance = newInstance;
}());
