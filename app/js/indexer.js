var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var configurator = require('./configurator');
var md5 = require('md5');
var path = require('path');

var dataDirPath = 'data';
var linksJsonPath = path.join(dataDirPath, 'links.json');
var sourceDirPath = 'source';

;(function () {
    'use strict';

    function Indexer (indexType) {

        //reassign this to _this, set indexId and rootPath
        let _this = this;
        _this.indexId = indexType;
        _this.rootPath = path.join(configurator.getValue('indexRootPath'), 'index', indexType);

        //internal functions
        function openFile (filePath) {
            let fullPath = path.join(_this.rootPath, filePath);
            let fileContents = null;
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
            let fileContents = openFile(filePath);
            if (fileContents === null) {
                return null;
            }
            return JSON.parse(fileContents);
        }

        function saveFile (filePath, fileContents) {
            let fullPath = path.join(_this.rootPath, filePath);
            let fullDirPath = path.dirname(fullPath);
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
            let links = openJson(linksJsonPath);
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
            let links = openJson(linksJsonPath);
            if (md5Hash in links) {
                links[md5Hash]--;
            }
            if (links.md5Hash<1) {
                // TODO: delete linked folder
            }
            saveFile(linksJsonPath, JSON.stringify(links));
        }
        /**/

        function indexItems (md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj) {
            let items = JSON.parse(catalogJson);
            let md5Path = path.join(dataDirPath, md5Hash);

            //save link file
            saveFile(catalogLinkFile, md5Hash);
            incrementLink(md5Hash);

            //save meta file
            if (typeof metaObj !== 'undefined') {
                let metaFilePath = path.join(md5Path, 'meta.json');
                let metaFileContent = typeof metaObj === 'object' ? JSON.stringify(metaObj) : metaObj;
                saveFile(metaFilePath, metaFileContent);
            }

            //save individual json files
            let filePath;
            let fileContent;
            let fileName;
            if (catalogType === 'simple') {
                for (let item of items) {
                    fileName = item.slug || null;
                    if (fileName !== null) {
                        filePath = path.join(md5Path, fileName + '.json');
                        fileContent = JSON.stringify(item);
                        saveFile(filePath, fileContent);
                    }
                }
            }
            if (catalogType === 'source') {
                for (let chapter of items) {
                    let folderName = chapter.number || null;
                    if (folderName !== null) {
                        let frames = chapter.frames;
                        delete chapter.frames;
                        filePath = path.join(md5Path, folderName, 'chapter.json');
                        fileContent = JSON.stringify(chapter);
                        saveFile(filePath, fileContent);
                        for (let frame of frames) {
                            fileName = frame.id.replace(/[0-9]+\-/g, '') || null;
                            if (fileName !== null) {
                                filePath = path.join(md5Path, folderName, fileName + '.json');
                                fileContent = JSON.stringify(frame);
                                saveFile(filePath, fileContent);
                            }
                        }
                    }
                }
            }

            return true;
        }

        function getItemsArray (itemObj, urlProp, subFolder) {
            let catalogApiUrl = getUrlFromObj(
                itemObj,
                urlProp
            );
            let md5Hash = md5(catalogApiUrl);
            let md5Path = path.join(dataDirPath, md5Hash);
            if (subFolder !== undefined) {
                md5Path = path.join(md5Path, subFolder);
            }
            let fullPath = path.join(_this.rootPath, md5Path);
            let files = fs.readdirSync(fullPath);
            let items = [];
            for (let x in files) {
                if (files.hasOwnProperty(x)) {
                    if (files[x] !== '.DS_Store' && files[x] !== 'meta.json' && files[x] !== 'chapter.json') {
                        items.push(files[x].replace('.json', ''));
                    }
                }
            }
            return items;
        }

        function getUrlFromObj (itemObj, urlProp) {
            return itemObj[urlProp].split('?')[0];
        }

        //public utility functions
        _this.getIndexId = function () {
            return _this.indexId;
        };
        _this.getIndexPath = function () {
            return _this.rootPath;
        };

        //public indexing functions
        _this.indexProjects = function (catalogJson) {
            let catalogApiUrl = getUrlFromObj(
                _this.getCatalog(),
                'proj_catalog'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, 'projects_catalog.link');
            let catalogType = 'simple';
            return indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson);
        };

        _this.indexSourceLanguages = function (projectId, catalogJson, metaObj) {
            //KLUDGE: modify v2 sourceLanguages catalogJson to match expected catalogJson format
            let items = JSON.parse(catalogJson);
            for (let item of items) {
                let language = item.language;
                for (let childProp in language) {
                    if (language.hasOwnProperty(childProp)) {
                        item[childProp] = language[childProp];
                    }
                }
                delete item.language;
            }
            catalogJson = JSON.stringify(items);
            //KLUDGE: end modify v2

            let catalogApiUrl = getUrlFromObj(
                _this.getProject(projectId),
                'lang_catalog'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, 'languages_catalog.link');
            let catalogType = 'simple';
            return indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
        };

        _this.indexResources = function (projectId, sourceLanguageId, catalogJson, metaObj) {
            let catalogApiUrl = getUrlFromObj(
                _this.getSourceLanguage(projectId, sourceLanguageId),
                'res_catalog'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, 'resources_catalog.link');
            let catalogType = 'simple';
            return indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
        };

        _this.indexSource = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
            //KLUDGE: modify v2 sources catalogJson to match expected catalogJson format
            let items = JSON.parse(catalogJson);
            items = items.chapters;
            catalogJson = JSON.stringify(items);
            //KLUDGE: end modify v2

            let catalogApiUrl = getUrlFromObj(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'source'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'source.link');
            let catalogType = 'source';
            return indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
        };

        _this.indexNotes = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
            let catalogApiUrl = getUrlFromObj(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'notes'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'notes.link');
            let catalogType = 'advanced';
            return indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
        };

        _this.indexTerms = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
            let catalogApiUrl = getUrlFromObj(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'terms'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'terms.link');
            let catalogType = 'advanced';
            return indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
        };

        _this.indexQuestions = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
            let catalogApiUrl = getUrlFromObj(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'checking_questions'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'checking_questions.link');
            let catalogType = 'advanced';
            return indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
        };

        //public string retrieval functions
        _this.getProjects = function () {
            let catalogArray = getItemsArray(
                _this.getCatalog(),
                'proj_catalog'
            );
            return catalogArray;
        };

        _this.getSourceLanguages = function (projectId) {
            let catalogArray = getItemsArray(
                _this.getProject(projectId),
                'lang_catalog'
            );
            return catalogArray;
        };

        _this.getResources = function (projectId, sourceLanguageId) {
            let catalogArray =  getItemsArray(
                _this.getSourceLanguage(projectId, sourceLanguageId),
                'res_catalog'
            );
            return catalogArray;
        };

        _this.getChapters = function (projectId, sourceLanguageId, resourceId) {
            let catalogArray =  getItemsArray(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'source'
            );
            return catalogArray;
        };

        _this.getFrames = function (projectId, sourceLanguageId, resourceId, chapterId) {
            let catalogArray =  getItemsArray(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'source',
                chapterId
            );
            return catalogArray;
        };

        //public json retrieval functions
        _this.getCatalog = function () {
            let catalogJson = {
                'proj_catalog': configurator.getValue('apiUrl')
            };
            return catalogJson;
        };

        _this.getProject = function (projectId) {
            let md5Hash = openFile(path.join(sourceDirPath, 'projects_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, projectId + '.json'));
            return catalogJson;
        };

        _this.getProjectMeta = function (projectId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, 'languages_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, 'meta.json'));
            return catalogJson;
        };

        _this.getSourceLanguage = function (projectId, sourceLanguageId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, 'languages_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, sourceLanguageId + '.json'));
            return catalogJson;
        };

        _this.getResource = function (projectId, sourceLanguageId, resourceId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, 'resources_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, resourceId + '.json'));
            return catalogJson;
        };

        _this.getChapter = function (projectId, sourceLanguageId, resourceId, chapterId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'source.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, chapterId, 'chapter.json'));
            return catalogJson;
        };

        _this.getFrame = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'source.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, chapterId, frameId + '.json'));
            return catalogJson;
        };

        _this.getNotes = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'notes.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, chapterId, frameId + '.json'));
            return catalogJson;
        };

        _this.getTerms = function (projectId, sourceLanguageId, resourceId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'terms.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, 'term.json'));
            return catalogJson;
        };

        _this.getQuestions = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'checking_questions.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, chapterId, frameId + '.json'));
            return catalogJson;
        };

        return _this;
    }

    exports.Indexer = Indexer;
}());
