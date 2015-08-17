'use strict';

;(function () {

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
    function Downloader (configJson, downloadIndex, appIndex) {
        if (typeof configJson === 'undefined') {
            throw new Error('missing the indexer configuration parameter');
        }

        //reassign this to _this, set path
        let _this = this;
        _this.config = _.merge({apiUrl: ''}, configJson);

        //PLACEHOLDER: remove after appIndex is used somewhere
        appIndex = appIndex;

        //internal functions
        function getUrlFromObj (itemObj, urlProp) {
            return itemObj[urlProp];
        }

        /**
         * Downloads the list of available projects from the server
         */
        _this.downloadProjectList = function () {
            return new Promise(function (resolve, reject) {
                var catalogApiUrl = _this.config.apiUrl;
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexProjects(catalogJson)) {
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
                    }
                });
            });
        };

        /**
         * Downloads the list of available source languages from the server
         * @param projectId The id of the project who's source languages will be downloaded
         */
        _this.downloadSourceLanguageList = function (projectId) {
            return new Promise(function (resolve, reject) {
                var catalogApiUrl = getUrlFromObj(
                    downloadIndex.getProject(projectId),
                    'lang_catalog'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexSourceLanguages(projectId, catalogJson)) {
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
                    }
                });
            });
        };

        /**
         * Downloads the list of available resources from the server
         * @param projectId The id of the project who's source languages will be downloaded
         * @param sourceLanguageId The id of the source language who's resources will be downloaded
         */
        _this.downloadResourceList = function (projectId, sourceLanguageId) {
            return new Promise(function (resolve, reject) {
                var catalogApiUrl = getUrlFromObj(
                    downloadIndex.getSourceLanguage(projectId, sourceLanguageId),
                    'res_catalog'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexResources(projectId, sourceLanguageId, catalogJson)) {
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
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
                var catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'source'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexSource(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
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
        _this.downloadTerms = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                var catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'terms'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexTerms(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
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
        _this.downloadNotes = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                var catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'notes'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexNotes(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
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
                var catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'checking_questions'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexQuestions(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
                    }
                });
            });
        };

        return _this;
    }

    exports.Downloader = Downloader;
}());

