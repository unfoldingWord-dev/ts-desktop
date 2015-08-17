var request = require('request');
//let moment = require('moment');
var configurator = require('./configurator');

;(function () {
    'use strict';

    function Downloader (configJson, downloadIndex, appIndex) {

        //reassign this to _this, set config values
        let _this = this;

        //PLACEHOLDER: remove after appIndex is used somewhere
        appIndex = appIndex;

        //internal functions
        function getUrlFromObj (itemObj, urlProp) {
            return itemObj[urlProp];
        }

        /**
         * Downloads the list of available projects from the server
         * @param callback called when the download is complete. Receives a boolean argument indicating success.
         */
        _this.downloadProjectList = function (callback) {
            let catalogApiUrl = _this.config.apiUrl;
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    callback(downloadIndex.indexProjects(catalogJson));
                } else {
                    callback(false);
                }
            });
        };

        _this.downloadSourceLanguageList = function (projectId) {
            let catalogApiUrl = getUrlFromObj(
                downloadIndex.getProject(projectId),
                'lang_catalog'
            );
            downloadIndex.getProject(projectId);
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexSourceLanguages(projectId, catalogJson);
                }
                return null;
            });
        };

        _this.downloadResourceList = function (projectId, sourceLanguageId) {
            let catalogApiUrl = getUrlFromObj(
                downloadIndex.getProjectgetSourceLanguage(projectId, sourceLanguageId),
                'res_catalog'
            );
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexResources(projectId, sourceLanguageId, catalogJson);
                }
                return null;
            });
        },

        _this.downloadSource = function (projectId, sourceLanguageId, resourceId) {
            let catalogApiUrl = getUrlFromObj(
                downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                'source'
            );
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexSource(projectId, sourceLanguageId, resourceId, catalogJson);
                }
                return null;
            });
        };

        _this.downloadTerms = function (projectId, sourceLanguageId, resourceId) {
            let catalogApiUrl = getUrlFromObj(
                downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                'terms'
            );
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexTerms(projectId, sourceLanguageId, resourceId, catalogJson);
                }
                return null;
            });
        };

        _this.downloadNotes = function (projectId, sourceLanguageId, resourceId) {
            let catalogApiUrl = getUrlFromObj(
                downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                'notes'
            );
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexNotes(projectId, sourceLanguageId, resourceId, catalogJson);
                }
                return null;
            });
        };

        _this.downloadCheckingQuestions = function (projectId, sourceLanguageId, resourceId) {
            let catalogApiUrl = getUrlFromObj(
                downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                'checking_questions'
            );
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexCheckingQuestions(projectId, sourceLanguageId, resourceId, catalogJson);
                }
                return null;
            });
        };

        return _this;
    }

    exports.Downloader = Downloader;
}());

