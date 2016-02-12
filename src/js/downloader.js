// downloader module

;(function () {
    'use strict';

    let request = require('request');
    let _ = require('lodash');

    /**
     *
     * @param configJson
     * @param downloadIndex
     * @param appIndex
     * @returns {Downloader}
     * @constructor
     */
    function Downloader (downloadIndex, configJson) {
        if (typeof configJson === 'undefined') {
            throw new Error('missing the indexer configuration parameter');
        }

        //reassign this to _this, set config
        let _this = this;
        _this.config = _.merge({apiUrl: ''}, configJson);

        /**
         * Downloads the list of available projects from the server
         */
        _this.downloadProjectList = function () {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = _this.config.apiUrl;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexProjects(catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the projects'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        /**
         * Downloads the list of available source languages from the server
         * @param projectId The id of the project whose source languages will be downloaded
         */
        _this.downloadSourceLanguageList = function (projectId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = downloadIndex.getProject(projectId).sourceLanguageCatalog;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexSourceLanguages(projectId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the source languages'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        /**
         * Downloads the list of available resources from the server
         * @param projectId The id of the project whose source languages will be downloaded
         * @param sourceLanguageId The id of the source language who's resources will be downloaded
         */
        _this.downloadResourceList = function (projectId, sourceLanguageId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = downloadIndex.getSourceLanguage(projectId, sourceLanguageId).resourceCatalog;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexResources(projectId, sourceLanguageId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the resources'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        /**
         * Downloads the source from the server
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         */
        _this.downloadSource = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = downloadIndex.getResource(projectId, sourceLanguageId, resourceId).sourceCatalog;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexSource(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the source'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        /**
         * Downloads the translationNotes from the server
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         */
        _this.downloadTranslationNotes = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = downloadIndex.getResource(projectId, sourceLanguageId, resourceId).translationNotesCatalog;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexTranslationNotes(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the notes'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        /**
         * Downloads the translationWords from the server
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         */
        _this.downloadTranslationWords = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = downloadIndex.getResource(projectId, sourceLanguageId, resourceId).translationWordsCatalog;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexTranslationWords(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the words'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        /**
         * Downloads the translationWordAssignments from the server
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         */
        _this.downloadTranslationWordAssignments = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = downloadIndex.getResource(projectId, sourceLanguageId, resourceId).translationWordAssignmentsCatalog;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexTerms(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the words'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        /**
         * Downloads the checking questions from the server
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         */
        _this.downloadCheckingQuestions = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = downloadIndex.getResource(projectId, sourceLanguageId, resourceId).checkingQuestionsCatalog;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexCheckingQuestions(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the questions'));
                        }
                    } else {
                        reject(error, response);
                    }
                });
            });
        };

        return _this;
    }

    exports.Downloader = Downloader;
}());

