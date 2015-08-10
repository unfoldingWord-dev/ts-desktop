var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var configurator = require('./configurator');
var md5 = require('md5');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var getUrlFromObj = utils.getUrlFromObj;

var dataDirPath = 'data';
var linksJsonPath = setPath('links.json', dataDirPath);
var sourceDirPath = 'source';

function Indexer (indexType) {
    'use strict';

    //reassign this to _this, set path
    var _this = this;
    _this.rootPath = setPath(indexType, configurator.getString('indexRootPath'));

    //internal functions
    function openFile (filePath) {
        var fullPath = setPath(filePath, _this.rootPath);
        var fileContents = null;
        if (fs.existsSync(fullPath)) {
            try {
                fileContents = fs.readFileSync(fullPath, 'utf8');
            }
            catch (err) {
                console.log(err);
                fileContents = null;
            }
        }
        return fileContents;
    }

    function openJson (filePath) {
        var fileContents = openFile(filePath);
        if (fileContents === null) {
            return null;
        }
        return JSON.parse(fileContents);
    }

    function saveFile (filePath, fileContents) {
        var fullPath = setPath(filePath, _this.rootPath);
        var fullDirPath = path.dirname(fullPath);
        try {
            mkdirp.sync(fullDirPath, '0755');
        }
        catch (err) {
            console.log(err);
            return false;
        }
        try {
            fs.writeFileSync(fullPath, fileContents);
        }
        catch (err) {
            console.log(err);
            return false;
        }
        return true;
    }

    function saveJson (filePath, fileContents) {
        return saveFile(filePath, JSON.stringify(fileContents));
    }

    function incrementLink (md5Hash) {
        var links = openJson(linksJsonPath);
        if (links === null) {
            links = {};
        }
        if (!(md5Hash in links)) {
            links[md5Hash] = 0;
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

    function indexItems (md5Hash, catalogLinkFile, catalogJson, metaObj) {
        var items = JSON.parse(catalogJson);
        var md5Path = setPath(md5Hash, dataDirPath);

        //save link file
        saveFile(catalogLinkFile, md5Hash);
        incrementLink(md5Hash);

        //save meta file
        if (typeof metaObj !== 'undefined') {
            var metaFilePath = setPath('meta.json', md5Path);
            var metaFileContent = typeof metaStr === 'object' ? JSON.stringify(metaObj) : metaObj;
            saveFile(metaFilePath, metaFileContent);
        }

        //save individual json files
        for (var x in items) {
            if (items.hasOwnProperty(x)) {
                var item = items[x];
                var fileName = item.slug || null;
                if (fileName !== null) {
                    var filePath = setPath(fileName + '.json', md5Path);
                    var fileContent = JSON.stringify(item);
                    saveFile(filePath, fileContent);
                }
            }
        }

        return true;
    }

    function getItemsArray (itemObj, urlProp) {
        var catalogApiUrl = getUrlFromObj(
            itemObj,
            urlProp,
            true
        );
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
        var catalogApiUrl = getUrlFromObj(
            _this.getCatalog(),
            'proj_catalog',
            true
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('projects_catalog.link', sourceDirPath);
        return indexItems(md5Hash, catalogLinkFile, catalogJson);
    };

    _this.indexSourceLanguages = function (projectId, catalogJson, metaObj) {
        var catalogApiUrl = getUrlFromObj(
            _this.getProject(projectId),
            'lang_catalog',
            true
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('languages_catalog.link', setPath(projectId, sourceDirPath));
        return indexItems(md5Hash, catalogLinkFile, catalogJson, metaObj);
    };

    _this.indexResources = function (projectId, sourceLanguageId, catalogJson, metaObj) {
        var catalogApiUrl = getUrlFromObj(
            _this.getSourceLanguage(projectId, sourceLanguageId),
            'res_catalog',
            true
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('resources_catalog.link', setPath(sourceLanguageId, setPath(projectId, sourceDirPath)));
        return indexItems(md5Hash, catalogLinkFile, catalogJson, metaObj);
    };

    _this.indexSource = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
        var catalogApiUrl = getUrlFromObj(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'source',
            true
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('source.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        return indexItems(md5Hash, catalogLinkFile, catalogJson, metaObj);
    };

    _this.indexNotes = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
        var catalogApiUrl = getUrlFromObj(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'notes',
            true
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('notes.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        return indexItems(md5Hash, catalogLinkFile, catalogJson, metaObj);
    };

    _this.indexTerms = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
        var catalogApiUrl = getUrlFromObj(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'terms',
            true
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('terms.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        return indexItems(md5Hash, catalogLinkFile, catalogJson, metaObj);
    };

    _this.indexQuestions = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
        var catalogApiUrl = getUrlFromObj(
            _this.getResource(projectId, sourceLanguageId, resourceId),
            'checking_questions',
            true
        );
        var md5Hash = md5(catalogApiUrl);
        var catalogLinkFile = setPath('checking_questions.link', setPath(resourceId, setPath(sourceLanguageId, setPath(projectId, sourceDirPath))));
        return indexItems(md5Hash, catalogLinkFile, catalogJson, metaObj);
    };

    //public json retrieval functions
    _this.getCatalog = function () {
        var catalogJson = {
            'proj_catalog': configurator.getString('apiUrl')
        };
        return catalogJson;
    };

    _this.getProject = function (projectId) {
        var md5Hash = openFile(setPath('projects_catalog.link', sourceDirPath));
        var catalogJson = openJson(setPath(projectId + '.json', setPath(md5Hash, dataDirPath)));
        return catalogJson;
    };

    _this.getProjectMeta = function (projectId) {
        var md5Hash = openFile(setPath('languages_catalog.link', setPath(projectId, sourceDirPath)));
        var catalogJson = openJson(setPath('meta.json', setPath(md5Hash, dataDirPath)));
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

    return _this;

}

exports.Indexer = Indexer;
