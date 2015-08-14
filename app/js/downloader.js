var request = require('request');
var unionObjects = require('./lib/util').unionObjects;

;(function () {
    'use strict';

    /**
     *
     * @param configJson
     * @param downloadIndex
     * @param appIndex
     * @returns {Downloader}
     * @constructor
     */
    function Downloader (configJson, downloadIndex, appIndex) {
        if(typeof configJson === 'undefined') {
            throw new Error('missing the indexer configuration parameter');
        }

        //reassign this to _this, set path
        let _this = this;
        _this.config = unionObjects({ apiUrl: ''}, configJson);

        //PLACEHOLDER: remove after appIndex is used somewhere
        appIndex = appIndex;

        //internal functions
        function getUrlFromObj (itemObj, urlProp) {
            return itemObj[urlProp];
        }

        _this.downloadProjectList = function () {
            var catalogApiUrl = _this.config.apiUrl;
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexProjects(catalogJson);
                }
                return null;
            });
        };

        _this.downloadSourceLanguageList = function (projectId) {
            var catalogApiUrl = getUrlFromObj(
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
            var catalogApiUrl = getUrlFromObj(
                downloadIndex.getSourceLanguage(projectId, sourceLanguageId),
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
            var catalogApiUrl = getUrlFromObj(
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
            var catalogApiUrl = getUrlFromObj(
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
            var catalogApiUrl = getUrlFromObj(
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
            var catalogApiUrl = getUrlFromObj(
                downloadIndex.getResource(projectId, sourceLanguageId, resourceId),
                'checking_questions'
            );
            request(catalogApiUrl, function (error, response, catalogJson) {
                if (!error && response.statusCode === 200) {
                    return downloadIndex.indexQuestions(projectId, sourceLanguageId, resourceId, catalogJson);
                }
                return null;
            });
        };

        return _this;
    }

    exports.Downloader = Downloader;
}());

