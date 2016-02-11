;(function () {
    "use strict";

    function TranslationWord(parameters) {
        let slug = parameters.slug;
        let term = parameters.term;
        let definition = parameters.definition;
        let definitionTitle = parameters.definitionTitle;
        let seeAlso = parameters.seeAlso;
        let aliases = parameters.aliases;
        let examples = parameters.examples;
        let _this = this;

        _this.getSlug = function() {
            return slug;
        };
        _this.getTerm = function() {
            return term;
        };
        _this.getDefinition = function() {
            return definition;
        };
        _this.getDefinitionTitle = function() {
            return definitionTitle;
        };
        _this.getAliases = function() {
            return aliases;
        };
        _this.getExamples = function() {
            return examples;
        };
        _this.getSeeAlso = function() {
            return seeAlso;
        };

        return _this;
    }


    /**
     * Returns a new translation note
     * @param parameters
     * @returns {TranslationWord}
     */
    function newInstance(parameters) {
        return new TranslationWord(parameters);
    }

    exports.newInstance = newInstance;
}());
