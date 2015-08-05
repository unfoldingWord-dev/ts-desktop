var fs = require('fs');
//var url = require('url');
//var _ = require('lodash');
var configurator = require('./configurator');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var md5 = require('md5');

var apiUrl = 'https://api.unfoldingword.org/ts/txt/2/';
var dataDirPath = 'data';
var linksJsonPath = setPath('links.json', dataDirPath);
var sourceDirPath = 'source';

var Indexer = function (indexType) {
    'use strict';

    //reassign this to indexer, set path
    var _this = this;
    _this.rootPath = setPath(indexType, configurator.getString('index_root_path')); //TODO: maybe make this not public?


    //internal functions
    function openFile (filePath) {
        var fullPath = setPath(filePath, _this.rootPath);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath, 'utf8');
        }
        return null;
    }

    function openJson (filePath) {
        var fileContents = openFile(filePath);
        return JSON.parse(fileContents);
    }

    function saveFile (filePath, fileContents) {
        var fullPath = setPath(filePath, _this.rootPath);
        fs.writeFileSync(fullPath, fileContents);
        return true;
    }

    function saveJson (filePath, fileContents) {
        saveFile(filePath, JSON.stringify(fileContents));
        return true;
    }

    function incrementLink (md5Hash) {
        var links = openJson(linksJsonPath);
        if (!(md5Hash in links)) {
            links.md5Hash = 0;
        }
        links[md5Hash]++;
        saveJson(linksJsonPath, links);
    }

    //TODO: activate later when we have a functions that uses this
    /** /
    function decrementLink(md5Hash) {
        var links = openJson(linksJsonPath);
        if (md5Hash in links) {
            links[md5Hash]--;
        }
        if (links.md5Hash<1) {
            // TODO: delete linked folder
        }
        saveFile(linksJsonPath, JSON.stringify(links));
    }
    /**/

    function indexItems (md5Hash, catalogLinkFile, catalogJson) {
        var items = JSON.parse(catalogJson);
        var md5Path = setPath(md5Hash, dataDirPath);
        saveFile(setPath(catalogLinkFile, sourceDirPath), md5Hash);
        incrementLink(md5Hash);
        for (var x in items) {
            if (items.hasOwnProperty(x)) {
                var item = items[x];
                var fileName = item.slug || null;
                if (fileName !== null) {
                    var filePath = md5Path + fileName + '.json';
                    var fileContent = JSON.stringify(item);
                    saveFile(filePath, fileContent);
                }
            }
        }
    }

    //public functions
    _this.indexProjects = function (catalogJson) {
        var md5Hash = md5(apiUrl + 'catalog.json');
        var catalogLinkFile = setPath('projects_catalog.link', sourceDirPath);
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexSourceLanguages = function (projectId, catalogJson) {
        var project = _this.getProject(projectId);
        var urlProp = 'lang_catalog';
        var catalogApiUrl = project[urlProp];
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('languages_catalog.link', setPath(projectId, sourceDirPath));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexResources = function (projectId, sourceLanguageId, catalogJson) {
        var sourceLanguage = _this.getProject(projectId);
        var urlProp = 'res_catalog';
        var catalogApiUrl = sourceLanguage[urlProp];
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('resources_catalog.link', setPath(sourceLanguageId, setPath(projectId, sourceDirPath)));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexSource = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        var md5Hash = md5(apiUrl + '/' + projectId + '/' + sourceLanguageId + '/' + resourceId + '/' + 'resources.json');
        var catalogLinkFile = setPath('source.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.getProjects = function () {
        //fs.readdirSync();
        //TODO: return JSON[]
    };

    _this.getSourceLanguages = function (projectId) {
        //TEMP: this will be replaced by file reads <<<
        projectId = projectId;
        //TEMP: >>>
        //TODO: return JSON[]
    };

    _this.getResources = function (projectId, sourceLanguageId) {
        //TEMP: this will be replaced by file reads <<<
        projectId = projectId;
        sourceLanguageId = sourceLanguageId;
        //TEMP: >>>
        //TODO: return JSON[]
    };

    _this.getProject = function (projectId) {
        var md5Hash = openFile(setPath('projects_catalog.link', sourceDirPath));
        var catalogJson = openJson(setPath(projectId + '.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

    _this.getSourceLanguage = function (projectId, sourceLanguageId) {
        var md5Hash = openFile(setPath('languages_catalog.link', setPath(projectId, sourceDirPath)));
        var catalogJson = openJson(setPath(sourceLanguageId + '.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

    _this.getResource = function (projectId, sourceLanguageid, resourceId) {
        var md5Hash = openFile(setPath('resources_catalog.link', setPath(sourceLanguageid, setPath(projectId, sourceDirPath))));
        var catalogJson = openJson(setPath(resourceId + '.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

};

exports.Indexer = Indexer;
