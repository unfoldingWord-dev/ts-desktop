// downloader module

;(function () {
    'use strict';

    let request = require('request');
    let _ = require('lodash');
    let url = require('url');

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

        //internal functions
        function getUrlFromObj (itemObj, urlProp) {
            return itemObj[urlProp];
        }

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
                let catalogApiUrl = getUrlFromObj(
                    downloadIndex.getProject(projectId),
                    'lang_catalog'
                );
                let metaObj = {
                    'date_modified': url.parse(catalogApiUrl, true).query
                };
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexSourceLanguages(projectId, catalogJson, metaObj)) {
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
                let catalogApiUrl = getUrlFromObj(
                    downloadIndex.getSourceLanguage(projectId, sourceLanguageId),
                    'res_catalog'
                );
                let metaObj = {
                    'date_modified': url.parse(catalogApiUrl, true).query
                };
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexResources(projectId, sourceLanguageId, catalogJson, metaObj)) {
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
                let catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'source'
                );
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
         * Downloads the translationWords from the server
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         */
        _this.downloadTerms = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'terms'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexTerms(projectId, sourceLanguageId, resourceId, catalogJson)) {
                            resolve();
                        } else {
                            reject(new Error('could not index the terms'));
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
        _this.downloadNotes = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'notes'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexNotes(projectId, sourceLanguageId, resourceId, catalogJson)) {
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
         * Downloads the checking questions from the server
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         */
        _this.downloadCheckingQuestions = function (projectId, sourceLanguageId, resourceId) {
            return new Promise(function (resolve, reject) {
                let catalogApiUrl = getUrlFromObj(
                    downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                    'checking_questions'
                );
                request(catalogApiUrl, function (error, response, catalogJson) {
                    if (!error && response.statusCode === 200) {
                        if (downloadIndex.indexQuestions(projectId, sourceLanguageId, resourceId, catalogJson)) {
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

