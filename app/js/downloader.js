//var request = require('request');
//var moment = require('moment');
//var utils = require('./lib/utils');
//var setPath = utils.setPath;
var Indexer = require('./indexer');
var downloaderIndex = new Indexer('download');

var downloader = {

    downloadProjectList: function () {
        'use strict';
        var url = 'https://api.unfoldingword.org/ts/txt/2/catalog.json';
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
        var url = project['lang_catalog'];
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
        var url = sourceLanguage['res_catalog'];
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
        var url = resource['source'];
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
        var url = resource['terms'];
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
        var url = resource['notes'];
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
        var url = resource['checking_questions'];
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