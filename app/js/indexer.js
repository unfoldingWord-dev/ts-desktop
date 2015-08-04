var fs = require('fs');
var url = require('url');
var _ = require('lodash');
var configurator = require('./configurator');
var utils = require('./lib/utils');
var setPath = utils.setPath;

var apiUrl = 'https://api.unfoldingword.org/ts/txt/2/';
var dataDirPath = 'data';
var linksJsonPath = setPath('links.json', dataDirPath);
var sourceDirPath = 'source';

var Indexer = function(indexType) {

    //reassign this to indexer, set path
    var indexer = this;
    indexer.rootPath = setPath(indexType, configurator.getString('index_root_path')); //TODO: maybe make this not public?


    //internal functions
    function openFile(filePath) {
        'use strict';
        var fullPath = setPath(filePath, indexer.rootPath);
        if (fs.existsSync(fullPath)) return fs.readFileSync(fullPath, 'utf8');
        return null;
    }

    function openJson(filePath) {
        'use strict';
        var fileContents = openFile(filePath);
        return JSON.parse(fileContents);
    }

    function saveFile(filePath, fileContents) {
        'use strict';
        var fullPath = setPath(filePath, indexer.rootPath);
        fs.writeFileSync(fullPath, fileContents);
        return true;
    }

    function saveJson(filePath, fileContents) {
        'use strict';
        saveFile(filePath, JSON.stringify(fileContents));
        return true;
    }

    function incrementLink(md5Hash) {
        'use strict';
        var links = openJson(linksJsonPath);
        if (!(md5Hash in links)) links[md5Hash] = 0;
        links[md5Hash]++;
        saveJson(linksJsonPath, links);
    }

    function decrementLink(md5Hash) {
        'use strict';
        var links = openJson(linksJsonPath);
        if (md5Hash in links) links[md5Hash]--;
        if (links[md5Hash]<1) // TODO: delete linked folder
        saveFile(linksJsonPath, JSON.stringify(links));
    }

    function indexItems(md5Hash, catalogLinkFile, catalogJson) {
        'use strict';
        var items = JSON.parse(catalogJson);
        var md5Path = setPath(md5Hash, dataDirPath);
        saveFile(setPath(catalogLinkFile, sourceDirPath), md5Hash);
        incrementLink(md5Hash);
        for (var x in items) {
            var item = items[x];
            var fileName = item.slug || null;
            if (fileName!=null) {
                var filePath = md5Path + fileName + '.json';
                var fileContent = JSON.stringify(item);
                saveFile(filePath, fileContent);
            }
        });
    }

    //public functions
    indexer.indexProjects = function (catalogJson) {
        'use strict';
        var md5Hash = md5(apiUrl + 'catalog.json');
        var catalogLinkFile = setPath('projects_catalog.link', sourceDirPath);
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    indexer.indexSourceLanguages = function (projectId, catalogJson) {
        'use strict';
        var project = indexer.getProject(projectId);
        var catalogApiUrl = project['lang_catalog'];
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('languages_catalog.link', setPath(projectId, sourceDirPath));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    indexer.indexResources = function (projectId, sourceLanguageId, catalogJson) {
        'use strict';
        var sourceLanguage = indexer.getProject(projectId);
        var catalogApiUrl = project['res_catalog'];
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('resources_catalog.link', setPath(sourceLanguageId, setPath(projectId, sourceDirPath)));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    indexer.indexSource = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        'use strict';
        var md5Hash = md5(apiUrl + '/' + projectId + '/' + sourceLanguageId + '/' + resourceId + '/' + 'resources.json');
        var catalogLinkFile = setPath('source.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    }

    indexer.getProjects = function () {
        'use strict';
        fs.readdirSync()
        //TODO: return JSON[]
    };

    indexer.getSourceLanguages = function (projectId) {
        'use strict';
        //TODO: return JSON[]
    };

    indexer.getResources = function (projectId, sourceLanguageId) {
        'use strict';
        //TODO: return JSON[]
    };

    indexer.getProject = function (projectId) {
        'use strict';
        var md5Hash = openFile(setPath('projects_catalog.link', sourceDirPath));
        var catalogJson = openJson(setPath(projectId+'.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

    indexer.getSourceLanguage = function (projectId, sourceLanguageId) {
        'use strict';
        var md5Hash = openFile(setPath('languages_catalog.link', setPath(projectId, sourceDirPath)));
        var catalogJson = openJson(setPath(sourceLanguageId+'.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

    indexer.getResource = function (projectId, sourceLanguageid, resourceId) {
        'use strict';
        var md5Hash = openFile(setPath('resources_catalog.link', setPath(sourceLanguageid, setPath(projectId, sourceDirPath))));
        var catalogJson = openJson(setPath(resourceId+'.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

}

exports.Indexer = Indexer;