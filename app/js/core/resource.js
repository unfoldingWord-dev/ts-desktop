;(function () {
    "use strict";

    function Resource(parameters) {
        let name = parameters.name;
        let slug = parameters.slug;
        let checkingLevel = parameters.checkingLevel;
        let version = parameters.version;
        let isDownloaded = parameters.isDownloaded;
        let dateModified = parameters.dateModified;
        let sourceCatalog = parameters.sourceCatalog;
        let sourceDateModified = parameters.sourceDateModified;
        let sourceServerDateModified = parameters.sourceServerDateModified;
        let notesCatalog = parameters.notesCatalog;
        let notesDateModified = parameters.notesDateModified;
        let notesServerDateModified = parameters.notesServerDateModified;
        let wordsCatalog = parameters.wordsCatalog;
        let wordsDateModified = parameters.wordsDateModified;
        let wordsServerDateModified = parameters.wordsServerDateModified;
        let wordAssignmentsCatalog = parameters.wordAssignmentsCatalog;
        let wordAssignmentsDateModified = parameters.wordAssignmentsDateModified;
        let wordAssignmentsServerDateModified = parameters.wordAssignmentsServerDateModified;
        let questionsCatalog = parameters.questionsCatalog;
        let questionsDateModified = parameters.questionsDateModified;
        let questionsServerDateModified = parameters.questionsServerDateModified;
        let _this = this;

        _this.getName = function() {
            return name;
        };
        _this.getSlug = function() {
            return slug;
        };
        _this.getCheckingLevel = function() {
            return checkingLevel;
        };
        _this.getVersion = function() {
            return version;
        };
        _this.isDownloaded = function() {
            return isDownloaded;
        };
        _this.getDateModified = function() {
            return dateModified;
        };
        _this.getSourceCatalog = function() {
            return sourceCatalog;
        };
        _this.getSourceDateModified = function() {
            return sourceDateModified;
        };
        _this.getSourceServerDateModified = function() {
            return sourceServerDateModified;
        };
        _this.getNotesCatalog = function() {
            return notesCatalog;
        };
        _this.getNotesDateModified = function() {
            return notesDateModified;
        };
        _this.getNotesServerDateModified = function() {
            return notesServerDateModified;
        };
        _this.getWordsCatalog = function() {
            return wordsCatalog;
        };
        _this.getWordsDateModified = function() {
            return wordsDateModified;
        };
        _this.getWordsServerDateModified = function() {
            return wordsServerDateModified;
        };
        _this.getWordAssignmentsCatalog = function() {
            return wordAssignmentsCatalog;
        };
        _this.getWordAssignmentsDateModified = function() {
            return wordAssignmentsDateModified;
        };
        _this.getWordAssignmentsServerDateModified = function() {
            return wordAssignmentsServerDateModified;
        };
        _this.getQuestionsCatalog = function() {
            return questionsCatalog;
        };
        _this.getQuestionsDateModified = function() {
            return questionsDateModified;
        };
        _this.getQuestionsServerDateModified = function() {
            return questionsServerDateModified;
        };

        return _this;
    }


    /**
     * Creates a new instance of a resource
     * @param parameters
     * @returns {Resource}
     */
    function newInstance(parameters) {
        return new Resource(parameters);
    }

    exports.newInstance = newInstance;
}());
