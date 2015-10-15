// indexer module

;(function () {
    'use strict';

    let fs = require('fs');
    let path = require('path');
    let mkdirp = require('mkdirp');
    let rimraf = require('rimraf');
    let SQL = require('sql.js');
    let md5 = require('md5');
    let _ = require('lodash');
    let raiseWithContext = require('./lib/util').raiseWithContext;
    let dataDirPath = 'data';
    let linksJsonPath = path.join(dataDirPath, 'links.json');
    let sourceDirPath = 'source';

    /**
     *
     * @param indexName the name of of the index. This will become a directory
     * @param configJson the index configuration. Requires an indexDir and apiUrl.
     * @returns {Indexer}
     * @constructor
     */
    function Indexer (indexName, configJson) {
        if (typeof configJson === 'undefined') {
            throw new Error('missing the indexer configuration parameter');
        }


        //reassign this to _this, set indexId and rootPath
        let _this = this;
        _this.config = _.merge({indexDir: ''}, configJson);
        _this.indexId = indexName;
        _this.rootPath = path.join(_this.config.indexDir, indexName);
        _this.dbFilePath = path.resolve('./', path.join(_this.config.indexDir, indexName + '.sqlite'));
        _this.dbDirPath = path.dirname(_this.dbFilePath);
        _this.needsDbSave = 0;
        if (!fs.existsSync(_this.dbFilePath)) {
            try {
                mkdirp.sync(_this.dbDirPath, '0755');
            }
            catch (err) {
                console.log(err);
                return false;
            }
            let db = new SQL.Database();
            db.exec('CREATE TABLE file (path text, dir text, file text, content text);');
            let data = db.export();
            let buffer = new Buffer(data);
            fs.writeFileSync(_this.dbFilePath, buffer);
        }
        let buffer = fs.readFileSync(_this.dbFilePath);
        let db = new SQL.Database(buffer);

        //internal functions
        function saveDb () {
            if (_this.needsDbSave !== 1) {
                return;
            }
            let data = db.export();
            let buffer = new Buffer(data);
            try {
                mkdirp.sync(_this.dbDirPath, '0755');
            }
            catch (err) {
                console.log(err);
                return false;
            }
            try {
                fs.writeFileSync(_this.dbFilePath, buffer);
            }
            catch (err) {
                console.log(err);
                return false;
            }
            _this.needsDbSave = 0;
            return true;
        }

        function openFile (filePath) {
            /** /
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
            /**/

            let statement = db.prepare('SELECT content FROM file WHERE path=:path');
            let result = statement.getAsObject({':path': filePath});
            statement.free();
            return result.content || null;
        }

        function deleteFile (filePath) {
            /** /
            let fullPath = path.join(_this.rootPath, filePath);
            if (fs.existsSync(fullPath)) {
                let stats = fs.lstatSync(fullPath);
                if (stats.isDirectory()) {
                    rimraf(fullPath);
                } else {
                    fs.unlinkSync(fullPath);
                }
            }
            /**/

            db.run('DELETE FROM file WHERE path = :path', {':path': filePath});
            _this.needsDbSave = 1;
            return true;
        }

        function openJson (filePath) {
            let fileContents = openFile(filePath);
            if (fileContents === null) {
                return null;
            }
            return JSON.parse(fileContents);
        }

        function saveFile (filePath, fileContents) {
            /** /
            let fullPath = path.join(_this.rootPath, filePath);
            let fullDirPath = path.dirname(fullPath);
            if (fullDirPath.indexOf('test') === 0) {
                return false;
            }
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
            /**/

            let fileDirPath = path.dirname(filePath);
            let fileName = path.basename(filePath, '.json');
            db.run('DELETE FROM file WHERE path = :path', {':path': filePath});
            db.run('INSERT INTO file (path, dir, file, content) VALUES (:path, :dir, :file, :content)', {':path': filePath, ':dir': fileDirPath, ':file': fileName, ':content': fileContents});
            _this.needsDbSave = 1;
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

        function decrementLink (md5Hash) {
            let links = openJson(linksJsonPath);
            if (links === null) {
                links = {};
            }
            if (md5Hash in links) {
                links[md5Hash]--;
            }
            if (links.md5Hash < 1) {
                let md5Path = path.join(dataDirPath, md5Hash);
                rimraf(md5Path);
            }
            saveFile(linksJsonPath, JSON.stringify(links));
        }

        function indexItems (md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj) {
            let items = JSON.parse(catalogJson);
            let md5Path = path.join(dataDirPath, md5Hash);

            //save link file
            saveFile(catalogLinkFile, md5Hash);
            incrementLink(md5Hash);

            //save meta file
            if (metaObj) {
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
                        filePath = path.join(md5Path, fileName);
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
                                filePath = path.join(md5Path, folderName, fileName);
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
            if (itemObj === null) {
                return [];
            }
            let catalogApiUrl = getUrlFromObj(
                itemObj,
                urlProp
            );
            let md5Hash = md5(catalogApiUrl);
            let md5Path = path.join(dataDirPath, md5Hash);
            if (subFolder !== undefined) {
                md5Path = path.join(md5Path, subFolder);
            }
            /** /
            let fullPath = path.join(_this.rootPath, md5Path);
            let items = [];
            if (fs.existsSync(fullPath)) {
                let files = fs.readdirSync(fullPath);
                for (let x in files) {
                    if (files.hasOwnProperty(x)) {
                        if (files[x] !== '.DS_Store' && files[x] !== 'meta.json' && files[x] !== 'chapter.json') {
                            items.push(files[x].replace('.json', ''));
                        }
                    }
                }
            }
            return items;
            /**/

            let items = [];
            if (catalogApiUrl.indexOf('source.json') !== -1 && subFolder === undefined) {
                //get chapters
                let trimDir = md5Path + path.sep;
                let statementChapters = db.prepare('SELECT DISTINCT dir FROM file WHERE dir LIKE :dir AND file <> \'chapter\' AND file <> \'meta\' ORDER BY path', {':dir': md5Path + '%'});
                while (statementChapters.step()) {
                    items.push(statementChapters.get()[0].replace(trimDir, ''));
                }
                statementChapters.free();
            } else {
                //get items
                let statement = db.prepare('SELECT file FROM file WHERE dir = :dir AND file <> \'chapter\' AND file <> \'meta\' ORDER BY path', {':dir': md5Path});
                while (statement.step()) {
                    items.push(statement.get()[0]);
                }
                statement.free();
            }
            return items;
        }

        function getUrlFromObj (itemObj, urlProp) {
            return itemObj[urlProp].split('?')[0];
        }

        function deleteResource (projectId, sourceLanguageId, resourceId) {
            let questions = _this.getQuestions(projectId, sourceLanguageId, resourceId);
            if (questions !== null) {
                throw new Error('deleting questions has not been implemented yet');
            }
            let notes = _this.getNotes(projectId, sourceLanguageId, resourceId);
            if (notes !== null) {
                throw new Error('deleting notes has not been implemented yet');
            }
            let terms = _this.getTerms(projectId, sourceLanguageId, resourceId);
            if (terms !== null) {
                throw new Error('deleting terms has not been implemented yet');
            }
            for (let chapterId of _this.getChapters(projectId, sourceLanguageId, resourceId)) {
                chapterId = chapterId;
                throw  new Error('deleting chapters has not been implemented yet');
            }

            // delete resource
            let resourceCatalogPath = path.join(sourceDirPath, projectId, sourceLanguageId, 'resources_catalog.link');
            let md5Hash = openFile(resourceCatalogPath);
            if (md5Hash !== null) {
                let hashPath = path.join(dataDirPath, md5Hash);
                let resourcePath = path.join(hashPath, resourceId);
                deleteFile(resourcePath);

                // delete empty resource catalog
                let files = fs.readdirSync(path.join(_this.rootPath, hashPath));
                if (_.size(files) <= 0 || _.size(files) === 1 && files[0] === 'meta.json') {
                    decrementLink(md5Hash);
                    deleteFile(resourceCatalogPath);
                }
            }
        }

        _this.deleteSourceLanguage = function (projectId, sourceLanguageId) {
            for (let resourceId of _this.getResources(projectId, sourceLanguageId)) {
                deleteResource(projectId, sourceLanguageId, resourceId);
            }
            // delete source language
            let languagesCatalogPath = path.join(sourceDirPath, projectId, 'languages_catalog.link');
            let md5Hash = openFile(languagesCatalogPath);
            if (md5Hash !== null) {
                let hashPath = path.join(dataDirPath, md5Hash);
                let sourceLanguagePath = path.join(hashPath, sourceLanguageId);
                deleteFile(sourceLanguagePath);

                // delete empty language catalog
                let files = fs.readdirSync(path.join(_this.rootPath, hashPath));
                if (_.size(files) <= 0 || _.size(files) === 1 && files[0] === 'meta.json') {
                    decrementLink(md5Hash);
                    deleteFile(languagesCatalogPath);
                }
            }
        };

        _this.deleteProject = function (projectId) {
            for (let sourceLanguageId of _this.getSourceLanguages(projectId)) {
                _this.deleteSourceLanguage(projectId, sourceLanguageId);
            }
            // delete project
            let md5Hash = openFile(path.join(sourceDirPath, 'projects_catalog.link'));
            if (md5Hash !== null) {
                let projectPath = path.join(dataDirPath, md5Hash, projectId);
                deleteFile(projectPath);
            }
        };

        /**
         * Merges another index into this index
         * @param index
         */
        _this.mergeIndex = function (index) {
            for (let projectId of index.getProjects()) {
                _this.mergeProject(index, projectId);
            }
        };

        /**
         * Merges a project from another index into this index
         * @param index
         * @param projectId
         */
        _this.mergeProject = function (index, projectId) {
            let newProject = index.getProject(projectId);
            if (newProject !== null) {
                let existingProject = _this.getProject(projectId);
                if (existingProject !== null) {
                    _this.deleteProject(projectId);
                }
                // insert project
                // TODO: update the project meta
                _this.indexProjects(JSON.stringify([newProject]));
                for (let sourceLanguageId of index.getSourceLanguages(projectId)) {
                    // TODO: update the source language meta
                    // insert source language
                    let sourceLanguageJson = JSON.stringify([index.getSourceLanguage(projectId, sourceLanguageId)]);
                    _this.indexSourceLanguages(projectId, sourceLanguageJson);
                    for (let resourceId of index.getResources(projectId, sourceLanguageId)) {
                        // TODO: update the resource meta
                        let resourceJson = JSON.stringify([index.getResource(projectId, sourceLanguageId, resourceId)]);
                        _this.indexResources(projectId, sourceLanguageId, resourceJson);

                        let questions = index.getQuestions(projectId, sourceLanguageId, resourceId);
                        if (questions !== null) {
                            throw new Error('merging questions has not been implemented yet');
                        }
                        let notes = index.getNotes(projectId, sourceLanguageId, resourceId);
                        if (notes !== null) {
                            throw new Error('merging notes has not been implemented yet');
                        }
                        let terms = index.getTerms(projectId, sourceLanguageId, resourceId);
                        if (terms !== null) {
                            throw new Error('merging terms has not been implemented yet');
                        }
                        for (let chapterId of index.getChapters(projectId, sourceLanguageId, resourceId)) {
                            chapterId = chapterId;
                            throw  new Error('merging chapters has not been implemented yet');
                        }
                    }
                }
            }
        };

        //public utility functions
        _this.getIndexId = function () {
            return _this.indexId;
        };
        _this.getIndexPath = function () {
            return _this.config.indexDir;
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
            let returnData = indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson);
            saveDb();
            return returnData;
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
            let returnData = indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
            saveDb();
            return returnData;
        };

        _this.indexResources = function (projectId, sourceLanguageId, catalogJson, metaObj) {
            let catalogApiUrl = '';

            try {
                catalogApiUrl = getUrlFromObj(
                    _this.getSourceLanguage(projectId, sourceLanguageId),
                    'res_catalog'
                );
            } catch (e) {
                raiseWithContext(e, {
                    projectId: projectId,
                    sourceLanguageId: sourceLanguageId
                });
            }

            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, 'resources_catalog.link');
            let catalogType = 'simple';
            let returnData = indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
            saveDb();
            return returnData;
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
            let returnData = indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
            saveDb();
            return returnData;
        };

        _this.indexNotes = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
            let catalogApiUrl = getUrlFromObj(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'notes'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'notes.link');
            let catalogType = 'advanced';
            let returnData = indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
            saveDb();
            return returnData;
        };

        _this.indexTerms = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
            let catalogApiUrl = getUrlFromObj(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'terms'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'terms.link');
            let catalogType = 'advanced';
            let returnData = indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
            saveDb();
            return returnData;
        };

        _this.indexQuestions = function (projectId, sourceLanguageId, resourceId, catalogJson, metaObj) {
            let catalogApiUrl = getUrlFromObj(
                _this.getResource(projectId, sourceLanguageId, resourceId),
                'checking_questions'
            );
            let md5Hash = md5(catalogApiUrl);
            let catalogLinkFile = path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'checking_questions.link');
            let catalogType = 'advanced';
            let returnData = indexItems(md5Hash, catalogLinkFile, catalogType, catalogJson, metaObj);
            saveDb();
            return returnData;
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
        // TODO: the indexer should not know anything about the api root.
        // It would be better to place this in the downloader module.
        _this.getCatalog = function () {
            let catalogJson = {
                'proj_catalog': '_'
            };
            return catalogJson;
        };

        _this.getProject = function (projectId) {
            let md5Hash = openFile(path.join(sourceDirPath, 'projects_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, projectId));
            return catalogJson;
        };

        _this.getProjectMeta = function (projectId, metaProp) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, 'languages_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, 'meta.json'));
            if (typeof metaProp !== 'undefined') {
                return catalogJson[metaProp];
            }
            return catalogJson;
        };

        _this.getSourceLanguage = function (projectId, sourceLanguageId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, 'languages_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, sourceLanguageId));
            return catalogJson;
        };

        _this.getSourceLanguageMeta = function (projectId, sourceLanguageId, metaProp) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, 'resources_catalog.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, 'meta.json'));
            if (typeof metaProp !== 'undefined') {
                return catalogJson[metaProp];
            }
            return catalogJson;
        };

        _this.getResource = function (projectId, sourceLanguageId, resourceId) {
            let linkPath = path.join(sourceDirPath, projectId, sourceLanguageId, 'resources_catalog.link');
            let md5Hash = openFile(linkPath);
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, resourceId));
            return catalogJson;
        };

        _this.getResourceMeta = function (projectId, sourceLanguageId, resourceId, metaProp) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'source.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, 'meta.json'));
            if (typeof metaProp !== 'undefined') {
                return catalogJson[metaProp];
            }
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
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, chapterId, frameId));
            return catalogJson;
        };

        _this.getNotes = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let md5Hash = openFile(path.join(sourceDirPath, projectId, sourceLanguageId, resourceId, 'notes.link'));
            if (md5Hash === null) {
                return null;
            }
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, chapterId, frameId));
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
            let catalogJson = openJson(path.join(dataDirPath, md5Hash, chapterId, frameId));
            return catalogJson;
        };

        return _this;
    }

    exports.Indexer = Indexer;
}());
