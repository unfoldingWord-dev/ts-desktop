//var request = require('request');
//var moment = require('moment');
//var utils = require('./lib/utils');
//var setPath = utils.setPath;
var configurator = require('./configurator');
var Indexer = require('./indexer');
var downloaderIndex = new Indexer('download');

var downloader = {

    downloadProjectList: function () {
        'use strict';
        var url = configurator.getString('apiUrl');
        //TODO: retrieve catalogJson
        //TEMP: this will be replaced by an AJAX request <<<
        url = url;
        var catalogJson = '';
        //TEMP: >>>
        downloaderIndex.indexProjects(catalogJson);
    },

    downloadSourceLanguageList: function (projectId) {
        'use strict';
        var project = downloaderIndex.getProject(projectId);
        var urlProp = 'lang_catalog';
        var url = project[urlProp];
        //TODO: retrieve catalogJson
        //TEMP: this will be replaced by an AJAX request <<<
        url = url;
        var catalogJson = '';
        //TEMP: >>>
        downloaderIndex.indexSourceLanguages(projectId, catalogJson);
    },

    downloadResourceList: function (projectId, sourceLanguageId) {
        'use strict';
        var sourceLanguage = downloaderIndex.getSourceLanguage(projectId, sourceLanguageId);
        var urlProp = 'res_catalog';
        var url = sourceLanguage[urlProp];
        //TODO: retrieve catalogJson
        //TEMP: this will be replaced by an AJAX request <<<
        url = url;
        var catalogJson = '';
        //TEMP: >>>
        downloaderIndex.indexResources(projectId, sourceLanguageId, catalogJson);
    },

    downloadSource: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var resource = downloaderIndex.getResource(projectId, sourceLanguageId, resourceId);
        var urlProp = 'source';
        var url = resource[urlProp];
        //TODO: retrieve catalogJson
        //TEMP: this will be replaced by an AJAX request <<<
        url = url;
        var catalogJson = '';
        //TEMP: >>>
        downloaderIndex.indexSource(projectId, sourceLanguageId, resourceId, catalogJson);
    },

    downloadTerms: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var resource = downloaderIndex.getResource(projectId, sourceLanguageId, resourceId);
        var urlProp = 'terms';
        var url = resource[urlProp];
        //TODO: retrieve catalogJson
        //TEMP: this will be replaced by an AJAX request <<<
        url = url;
        var catalogJson = '';
        //TEMP: >>>
        downloaderIndex.indexTerms(projectId, sourceLanguageId, resourceId, catalogJson);
    },

    downloadNotes: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var resource = downloaderIndex.getResource(projectId, sourceLanguageId, resourceId);
        var urlProp = 'notes';
        var url = resource[urlProp];
        //TODO: retrieve catalogJson
        //TEMP: this will be replaced by an AJAX request <<<
        url = url;
        var catalogJson = '';
        //TEMP: >>>
        downloaderIndex.indexNotes(projectId, sourceLanguageId, resourceId, catalogJson);
    },

    downloadCheckingQuestions: function (projectId, sourceLanguageId, resourceId) {
        'use strict';
        var resource = downloaderIndex.getResource(projectId, sourceLanguageId, resourceId);
        var urlProp = 'checking_questions';
        var url = resource[urlProp];
        //TODO: retrieve catalogJson
        //TEMP: this will be replaced by an AJAX request <<<
        url = url;
        var catalogJson = '';
        //TEMP: >>>
        downloaderIndex.indexCheckingQuestions(projectId, sourceLanguageId, resourceId, catalogJson);
    }

};

exports.downloadProjectList = downloader.downloadProjectList;
exports.downloadSourceLanguageList = downloader.downloadSourceLanguageList;
exports.downloadResourceList = downloader.downloadResourceList;
exports.downloadSource = downloader.downloadSource;
exports.downloadTerms = downloader.downloadTerms;
exports.downloadNotes = downloader.downloadNotes;
exports.downloadCheckingQuestions = downloader.downloadCheckingQuestions;
