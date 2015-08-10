var request = require('request');
//var moment = require('moment');
var configurator = require('./configurator');
var Indexer = require('./indexer');
var downloaderIndex = new Indexer('download');
var utils = require('./lib/utils');
var getUrlFromObj = utils.getUrlFromObj;

var downloader = {

    downloadProjectList: function () {
        'use strict';
        var catalogApiUrl = configurator.getString('apiUrl');
        request(catalogApiUrl, function (error, response, catalogJson) {
            if (!error && response.statusCode === 200) {
                return downloaderIndex.indexProjects(catalogJson);
            }
            return null;
        });
    },

    downloadSourceLanguageList: function (projectId) {
        'use strict';
        var catalogApiUrl = getUrlFromObj(
            downloaderIndex.getProject(projectId),
            'lang_catalog'
        );
        downloaderIndex.getProject(projectId);
        request(catalogApiUrl, function (error, response, catalogJson) {
            if (!error && response.statusCode === 200) {
                return downloaderIndex.indexSourceLanguages(projectId, catalogJson);
            }
            return null;
        });
    },

    downloadResourceList: function (projectId, sourceLanguageId) {
        'use strict';
        var catalogApiUrl = getUrlFromObj(
            downloaderIndex.getProjectgetSourceLanguage(projectId, sourceLanguageId),
            'res_catalog'
        );
        request(catalogApiUrl, function (error, response, catalogJson) {
            if (!error && response.statusCode === 200) {
                return downloaderIndex.indexResources(projectId, sourceLanguageId, catalogJson);
            }
            return null;
        });
    },

    downloadSource: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var catalogApiUrl = getUrlFromObj(
            downloaderIndex.getResource(projectId, sourceLanguageId, resourceId),
            'source'
        );
        request(catalogApiUrl, function (error, response, catalogJson) {
            if (!error && response.statusCode === 200) {
                return downloaderIndex.indexSource(projectId, sourceLanguageId, resourceId, catalogJson);
            }
            return null;
        });
    },

    downloadTerms: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var catalogApiUrl = getUrlFromObj(
            downloaderIndex.getResource(projectId, sourceLanguageId, resourceId),
            'terms'
        );
        request(catalogApiUrl, function (error, response, catalogJson) {
            if (!error && response.statusCode === 200) {
                return downloaderIndex.indexTerms(projectId, sourceLanguageId, resourceId, catalogJson);
            }
            return null;
        });
    },

    downloadNotes: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var catalogApiUrl = getUrlFromObj(
            downloaderIndex.getResource(projectId, sourceLanguageId, resourceId),
            'notes'
        );
        request(catalogApiUrl, function (error, response, catalogJson) {
            if (!error && response.statusCode === 200) {
                return downloaderIndex.indexNotes(projectId, sourceLanguageId, resourceId, catalogJson);
            }
            return null;
        });
    },

    downloadCheckingQuestions: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var catalogApiUrl = getUrlFromObj(
            downloaderIndex.getResource(projectId, sourceLanguageId, resourceId),
            'checking_questions'
        );
        request(catalogApiUrl, function (error, response, catalogJson) {
            if (!error && response.statusCode === 200) {
                return downloaderIndex.indexCheckingQuestions(projectId, sourceLanguageId, resourceId, catalogJson);
            }
            return null;
        });
    }

};

exports.downloadProjectList = downloader.downloadProjectList;
exports.downloadSourceLanguageList = downloader.downloadSourceLanguageList;
exports.downloadResourceList = downloader.downloadResourceList;
exports.downloadSource = downloader.downloadSource;
exports.downloadTerms = downloader.downloadTerms;
exports.downloadNotes = downloader.downloadNotes;
exports.downloadCheckingQuestions = downloader.downloadCheckingQuestions;
