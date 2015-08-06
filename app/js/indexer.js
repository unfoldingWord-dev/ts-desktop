var fs = require('fs');
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
        saveFile(catalogLinkFile, md5Hash);
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

    function getItemURL (itemObj, urlProp) {
        return itemObj[urlProp].split('?')[0];
    }

    function getItemsArray (itemObj, urlProp) {
        var catalogApiUrl = itemObj[urlProp].split('?')[0];
        var md5Hash = md5(catalogApiUrl);
        var md5Path = setPath(md5Hash, dataDirPath);
        if (arguments.length > 2) {
            var subFolder = arguments[2];
            md5Path = setPath(subFolder, md5Path);
        }
        var files = fs.readdirSync(md5Path);
        var items = [];
        for (var x in files) {
            if (files.hasOwnProperty(x)) {
                var excludeFile = '';
                if (arguments.length > 3) {
                    excludeFile = arguments[3];
                }
                if (files[x] !== excludeFile) {
                    items.push(files[x].replace('.json', ''));
                }
            }
        }
        return items;
    }

    //public indexing functions
    _this.indexProjects = function (catalogJson) {
        var catalogApiUrl = getItemURL(
            _this.getCatalog(),
            'proj_catalog'
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('projects_catalog.link', sourceDirPath);
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexSourceLanguages = function (projectId, catalogJson) {
        var catalogApiUrl = getItemURL(
            _this.getProject(projectId),
            'lang_catalog'
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('languages_catalog.link', setPath(projectId, sourceDirPath));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexResources = function (projectId, sourceLanguageId, catalogJson) {
        var catalogApiUrl = getItemURL(
            _this.getSourceLanguage(projectId, sourceLanguageId),
            'res_catalog'
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('resources_catalog.link', setPath(sourceLanguageId, setPath(projectId, sourceDirPath)));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexSource = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        var catalogApiUrl = getItemURL(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'source'
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('source.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexNotes = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        var catalogApiUrl = getItemURL(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'notes'
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('notes.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexTerms = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        var catalogApiUrl = getItemURL(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'terms'
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('terms.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexQuestions = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        var catalogApiUrl = getItemURL(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'checking_questions'
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('checking_questions.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    //public json retrieval functions
    _this.getCatalog = function () {
        var catalogJson = {
            'proj_catalog': apiUrl + 'catalog.json'
        };
        return catalogJson;
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

    _this.getResource = function (projectId, sourceLanguageId, resourceId) {
        var md5Hash = openFile(setPath('resources_catalog.link', setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        var catalogJson = openJson(setPath(resourceId + '.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

    _this.getChapter = function (projectId, sourceLanguageId, resourceId, chapterId) {
        var md5Hash = openFile(setPath('source.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath)))));
        var catalogJson = openJson(setPath('chapter.json', setPath(chapterId, setPath(resourceId, setPath(md5Hash, dataDirPath)))));
        return catalogJson;
    };

    _this.getFrame = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
        var md5Hash = openFile(setPath('source.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath)))));
        var catalogJson = openJson(setPath(frameId + '.json', setPath(chapterId, setPath(resourceId, setPath(md5Hash, dataDirPath)))));
        return catalogJson;
    };

    _this.getNotes = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
        var md5Hash = openFile(setPath('notes.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath)))));
        var catalogJson = openJson(setPath(frameId + '.json', setPath(chapterId, setPath(resourceId, setPath(md5Hash, dataDirPath)))));
        return catalogJson;
    };

    _this.getTerms = function (projectId, sourceLanguageId, resourceId) {
        var md5Hash = openFile(setPath('terms.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath)))));
        var catalogJson = openJson(setPath('term.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

    _this.getQuestions = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
        var md5Hash = openFile(setPath('checking_questions.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath)))));
        var catalogJson = openJson(setPath(frameId + '.json', setPath(chapterId, setPath(resourceId, setPath(md5Hash, dataDirPath)))));
        return catalogJson;
    };

    //public string retrieval functions
    _this.getProjects = function () {
        var catalogArray = getItemsArray(
            _this.getCatalog(),
            'proj_catalog'
        );
        return catalogArray;
    };

    _this.getSourceLanguages = function (projectId) {
        var catalogArray = getItemsArray(
            _this.getProject(projectId),
            'lang_catalog'
        );
        return catalogArray;
    };

    _this.getResources = function (projectId, sourceLanguageId) {
        var catalogArray =  getItemsArray(
            _this.getSourceLanguage(projectId, sourceLanguageId),
            'res_catalog'
        );
        return catalogArray;
    };

    _this.getChapters = function (projectId, sourceLanguageId, resourceId) {
        var catalogArray =  getItemsArray(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'source'
        );
        return catalogArray;
    };

    _this.getFrames = function (projectId, sourceLanguageId, resourceId, chapterId) {
        var catalogArray =  getItemsArray(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'source',
            chapterId,
            'chapter.json'
        );
        return catalogArray;
    };

};

exports.Indexer = Indexer;
