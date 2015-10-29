// indexer module

;(function () {
    'use strict';

    //let md5 = require('md5');
    let url = require('url');
    let _ = require('lodash');
    //let raiseWithContext = require('./lib/util').raiseWithContext;
    //let dataDirPath = 'data';
    //let linksJsonPath = path.join(dataDirPath, 'links.json');
    //let sourceDirPath = 'source';
    let Db = require('./lib/db').Db;
    let ContentValues = require('./lib/content-values').ContentValues;

    let apiVersion = 2;

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
        //_this.rootPath = path.join(_this.config.indexDir, indexName);
        _this.needsDbSave = 0;
        let db = new Db(_this.config.indexDir);

        //private db id lookup functions
        function getProjectDbId (projectId) {
            let results = db.selectOne('project', 'id', '`slug`=?', [projectId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        function getSourceLanguageDbId (projectId, sourceLanguageId) {
            let projectDbId = getProjectDbId(projectId);
            let results = db.selectOne('source_language', 'id', '`slug`=? AND `project_id`=?', [sourceLanguageId, projectDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        function getResourceDbId (projectId, sourceLanguageId, resourceId) {
            let sourceLanguageDbId = getSourceLanguageDbId(projectId, sourceLanguageId);
            let results = db.selectOne('resource', 'id', '`slug`=? AND `source_language_id`=?', [resourceId, sourceLanguageDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        function getChapterDbId (projectId, sourceLanguageId, resourceId, chapterId) {
            let resourceDbId = getResourceDbId(projectId, sourceLanguageId, resourceId);
            let results = db.selectOne('chapter', 'id', '`slug`=? AND `resource_id`=?', [chapterId, resourceDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        function getFrameDbId (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let chapterDbId = getChapterDbId(projectId, sourceLanguageId, resourceId, chapterId);
            let results = db.selectOne('frame', 'id', '`slug`=? AND `chapter_id`=?', [frameId, chapterDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        //public utility functions
        _this.getIndexId = function () {
            return _this.indexId;
        };
        _this.getIndexPath = function () {
            return _this.config.indexDir;
        };

        //public indexing functions
        _this.indexProjects = function (catalogJson) {

            //set table
            let table = 'project';

            //set variable mapping
            let apiPropLists = {
                2: {
                    dateModified: 'date_modified',
                    slug: 'slug',
                    sort: 'sort',
                    languageCatalog: 'lang_catalog',
                    categorySlugs: 'meta'
                },
                3: {
                    dateModified: 'mod',
                    slug: 'slug',
                    sort: 'sort',
                    languageCatalog: 'lang_cat',
                    categorySlugs: 'category_slugs'
                }
            };
            let apiProps = apiPropLists[apiVersion];

            //parse JSON
            let items = JSON.parse(catalogJson);

            //get existing slug: id list
            let existingItems = {};
            let results = db.select(table, ['slug', 'id']);
            if (results !== null) {
                for (let result of results) {
                    existingItems[result[0]] = result[1];
                }
            }

            //insert items into db
            for (let item of items) {

                //save item
                let itemSlug = _.get(item, apiProps.slug);
                let itemId = existingItems[itemSlug] || null;
                let dbFields = {
                    dateModified: 'modified_at',
                    slug: 'slug',
                    sort: 'sort',
                    languageCatalog: 'source_language_catalog_url'
                };
                let values = new ContentValues();
                for (let key in apiProps) {
                    if (apiProps.hasOwnProperty(key) && typeof dbFields[key] !== 'undefined') {
                        values.set(dbFields[key], _.get(item, apiProps[key]));
                    }
                }
                if (itemId === null) {
                    itemId = db.insert(table, values);
                    existingItems[itemSlug] = itemId;
                } else {
                    db.update(table, values, '`id`=?', [itemId]);
                }

                //reset relational links
                db.delete(table + '__category', '`' + table + '_id`=?', [itemId]);

                //add categories
                let categorySlugs = _.get(item, apiProps.categorySlugs);
                addProjectCategories(itemId, categorySlugs);
            }
            db.saveToDisk();
            return true;
        };

        function addProjectCategories (projectDbId, categorySlugs) {
            if (categorySlugs === null || categorySlugs.length <= 0) {
                return false;
            }
            let categoryDbId = 0;
            for (let categorySlug of categorySlugs) {
                let results = db.selectOne('category', 'id', 'slug=? AND parent_id=?', [categorySlug, categoryDbId]);
                if (typeof results.id !== 'undefined') {
                    categoryDbId = results.id;
                } else {
                    let values = new ContentValues();
                    values.set('slug', categorySlug);
                    values.set('parent_id', categoryDbId);
                    categoryDbId = db.insert('category', values);
                }
            }
            let values = new ContentValues();
            values.set('project_id', projectDbId);
            values.set('category_id', categoryDbId);
            db.insert('project__category', values);
            return true;
        }

        _this.indexSourceLanguages = function (projectId, catalogJson) {

            if (typeof projectId === 'undefined') {
                return null;
            }

            //get id
            let projectDbId = getProjectDbId(projectId);
            if (projectDbId === null) {
                return null;
            }

            //set table
            let table = 'source_language';

            //set variable mapping
            let apiPropLists = {
                2: {
                    dateModified: 'language.date_modified',
                    slug: 'language.slug',
                    name: 'language.name',
                    direction: 'language.direction',
                    projectName: 'project.name',
                    projectDescription: 'project.desc',
                    categoryNames: 'project.meta',
                    resourceCatalog: 'res_catalog'
                },
                3: {
                    dateModified: 'mod',
                    slug: 'slug',
                    name: 'name',
                    direction: 'dir',
                    projectName: 'project.name',
                    projectDescription: 'project.desc',
                    categoryNames: 'project.category_names',
                    resourceCatalog: 'res_cat'
                }
            };
            let apiProps = apiPropLists[apiVersion];

            //parse JSON
            let items = JSON.parse(catalogJson);

            //get existing slug: id list
            let existingItems = {};
            let results = db.select(table, ['slug', 'id'], '`project_id`=?', [projectDbId]);
            if (results !== null) {
                for (let result of results) {
                    existingItems[result[0]] = result[1];
                }
            }

            //insert items into db
            for (let item of items) {

                //save item
                let itemSlug = _.get(item, apiProps.slug);
                let itemId = existingItems[itemSlug] || null;
                let dbFields = {
                    dateModified: 'modified_at',
                    projectId: 'project_id',
                    slug: 'slug',
                    name: 'name',
                    direction: 'direction',
                    projectName: 'project_name',
                    projectDescription: 'project_description',
                    resourceCatalog: 'resource_catalog_url'
                };
                let values = new ContentValues();
                for (let key in apiProps) {
                    if (apiProps.hasOwnProperty(key) && typeof dbFields[key] !== 'undefined') {
                        values.set(dbFields[key], _.get(item, apiProps[key]));
                    }
                }
                values.set(dbFields.projectId, projectDbId);
                if (itemId === null) {
                    itemId = db.insert(table, values);
                    existingItems[itemSlug] = itemId;
                } else {
                    db.update(table, values, '`id`=?', [itemId]);
                }

                //reset relational links
                db.delete(table + '__category', '`' + table + '_id`=?', [itemId]);

                //add categories
                let categoryNames = _.get(item, apiProps.categoryNames);
                addSourceLanguageCategories(projectDbId, itemId, categoryNames);
            }
            db.saveToDisk();
            return true;
        };

        function addSourceLanguageCategories (projectDbId, sourceLanguageDbId, categoryNames) {
            if (categoryNames === null || categoryNames.length <= 0) {
                return false;
            }
            let query = 'SELECT `c`.`id` FROM `category` AS `c` ' +
                'LEFT JOIN `project__category` AS `pc` ON `pc`.`category_id`=`c`.`id` ' +
                'WHERE `pc`.`project_id`=:project_id';
            let results = db.selectRaw(query, {':project_id': projectDbId});
            if (results === null) {
                return false;
            }
            let categoryDbId = results[0][0];
            for (let categoryName of categoryNames) {
                let values = new ContentValues();
                values.set('source_language_id', sourceLanguageDbId);
                values.set('category_id', categoryDbId);
                values.set('category_name', categoryName);
                db.insert('source_language__category', values);

                let results = db.selectOne('category', 'parent_id', 'id=?', [categoryDbId]);
                if (typeof results.id !== 'undefined') {
                    categoryDbId = results.id;
                } else {
                    break;
                }
            }
            return true;
        }

        _this.indexResources = function (projectId, sourceLanguageId, catalogJson) {

            if (typeof projectId === 'undefined' || typeof sourceLanguageId === 'undefined') {
                return null;
            }

            //get id
            let sourceLanguageDbId = getSourceLanguageDbId(projectId, sourceLanguageId);
            if (sourceLanguageDbId === null) {
                return null;
            }

            //set table
            let table = 'resource';

            //set variable mapping
            let apiPropLists = {
                2: {
                    dateModified: 'date_modified',
                    slug: 'slug',
                    name: 'name',
                    checkingLevel: 'status.checking_level',
                    version: 'status.version',
                    sourceCatalog: 'source',
                    translationNotesCatalog: 'notes',
                    translationWordsCatalog: 'terms',
                    translationWordAssignmentsCatalog: '???',
                    checkingQuestionsCatalog: 'checking_questions'
                },
                3: {
                    dateModified: 'mod',
                    slug: 'slug',
                    name: 'name',
                    checkingLevel: 'checking_lvl',
                    version: 'ver',
                    sourceCatalog: 'src_cat',
                    translationNotesCatalog: 'tn_cat',
                    translationWordsCatalog: 'tw_cat',
                    translationWordAssignmentsCatalog: 'twq_cat',
                    checkingQuestionsCatalog: 'cq_cat'
                }
            };
            let apiProps = apiPropLists[apiVersion];

            //parse JSON
            let items = JSON.parse(catalogJson);

            //get existing slug: id list
            let existingItems = {};
            let results = db.select(table, ['slug', 'id'], '`source_language_id`=?', [sourceLanguageDbId]);
            if (results !== null) {
                for (let result of results) {
                    existingItems[result[0]] = result[1];
                }
            }

            //insert items into db
            for (let item of items) {

                //save item
                let itemSlug = _.get(item, apiProps.slug);
                let itemId = existingItems[itemSlug] || null;
                let dbFields = {
                    dateModified: 'modified_at',
                    sourceLanguageId: 'source_language_id',
                    slug: 'slug',
                    name: 'name',
                    checkingLevel: 'checking_level',
                    version: 'version',
                    sourceCatalog: 'source_catalog_url',
                    sourceDateModified: 'source_catalog_server_modified_at',
                    translationNotesCatalog: 'translation_notes_catalog_url',
                    translationNotesDateModified: 'translation_notes_catalog_server_modified_at',
                    translationWordsCatalog: 'translation_words_catalog_url',
                    translationWordsDateModified: 'translation_words_catalog_server_modified_at',
                    translationWordAssignmentsCatalog: 'translation_word_assignments_catalog_url',
                    translationWordAssignmentsDateModified: 'translation_word_assignments_catalog_server_modified_at',
                    checkingQuestionsCatalog: 'checking_questions_catalog_url',
                    checkingQuestionsDateModified: 'checking_questions_catalog_server_modified_at'
                };
                let values = new ContentValues();
                for (let key in apiProps) {
                    if (apiProps.hasOwnProperty(key) && typeof dbFields[key] !== 'undefined') {
                        values.set(dbFields[key], _.get(item, apiProps[key]));
                    }
                }
                values.set(dbFields.sourceLanguageId, sourceLanguageDbId);
                let dateFields = [
                    'source',
                    'translationNotes',
                    'translationWords',
                    'translationWordAssignments',
                    'checkingQuestions'
                ];
                for (let dateField of dateFields) {
                    let catalogUrl = values.get(dbFields[dateField + 'Catalog']);
                    let dateValue = null;
                    if (typeof catalogUrl !== 'undefined') {
                        let queryItems = url.parse(catalogUrl, true).query;
                        dateValue = queryItems[apiProps.dateModified] || null;
                    } else {
                        values.set(dbFields[dateField + 'Catalog'], '');
                    }
                    if (dateValue !== null) {
                        values.set(dbFields[dateField + 'DateModified'], dateValue);
                    }
                }
                if (itemId === null) {
                    itemId = db.insert(table, values);
                    existingItems[itemSlug] = itemId;
                } else {
                    db.update(table, values, '`id`=?', [itemId]);
                }
            }
            db.saveToDisk();
            return true;
        };

        _this.indexSource = function (projectId, sourceLanguageId, resourceId, catalogJson) {

            if (typeof projectId === 'undefined' || typeof sourceLanguageId === 'undefined' || typeof resourceId === 'undefined') {
                return null;
            }

            //get id
            let resourceDbId = getResourceDbId(projectId, sourceLanguageId, resourceId);
            if (resourceDbId === null) {
                return null;
            }

            //set table
            let table = 'chapter';

            //set variable mapping
            let apiPropLists = {
                2: {
                    slug: 'number',
                    reference: 'ref',
                    title: 'title'
                },
                3: {
                    slug: 'slug',
                    reference: 'ref',
                    title: 'title'
                }
            };
            let apiProps = apiPropLists[apiVersion];

            //parse JSON
            let parentItems = JSON.parse(catalogJson);
            let items = parentItems.chapters;

            if (typeof items === 'undefined') {
                return false;
            }

            //get existing slug: id list
            let existingItems = {};
            let results = db.select(table, ['slug', 'id'], '`resource_id`=?', [resourceDbId]);
            if (results !== null) {
                for (let result of results) {
                    existingItems[result[0]] = result[1];
                }
            }

            //insert items into db
            for (let item of items) {

                //save item
                let itemSlug = _.get(item, apiProps.slug);
                let itemId = existingItems[itemSlug] || null;
                let dbFields = {
                    resourceId: 'resource_id',
                    slug: 'slug',
                    reference: 'reference',
                    title: 'title',
                    sort: 'sort'
                };
                let values = new ContentValues();
                for (let key in apiProps) {
                    if (apiProps.hasOwnProperty(key) && typeof dbFields[key] !== 'undefined') {
                        values.set(dbFields[key], _.get(item, apiProps[key]));
                    }
                }
                values.set(dbFields.resourceId, resourceDbId);
                let chapterSlug = values.get(dbFields.slug);
                let sortValue = null;
                if (typeof chapterSlug !== 'undefined') {
                    sortValue = parseInt(chapterSlug, 10) || null;
                }
                if (sortValue !== null) {
                    values.set(dbFields.sort, sortValue);
                }
                if (itemId === null) {
                    itemId = db.insert(table, values);
                    existingItems[itemSlug] = itemId;
                } else {
                    db.update(table, values, '`id`=?', [itemId]);
                }

                addFrames(itemId, item.frames);
            }
            db.saveToDisk();
            return true;
        };

        function addFrames (chapterDbId, items) {

            //set table
            let table = 'frame';

            //set variable mapping
            let apiPropLists = {
                2: {
                    slug: 'id',
                    body: 'text',
                    imageUrl: 'img'
                },
                3: {
                    slug: 'slug',
                    body: 'body',
                    imageUrl: 'img'
                }
            };
            let apiProps = apiPropLists[apiVersion];

            //get existing slug: id list
            let existingItems = {};
            let results = db.select(table, ['slug', 'id'], '`chapter_id`=?', [chapterDbId]);
            if (results !== null) {
                for (let result of results) {
                    existingItems[result[0]] = result[1];
                }
            }

            //insert items into db
            for (let item of items) {

                //save item
                if (apiVersion === 2) {
                    let itemSlug = _.get(item, apiProps.slug);
                    itemSlug = itemSlug.replace(/[0-9]{2}\-/, '');
                    _.set(item, apiProps.slug, itemSlug);
                }
                let itemSlug = _.get(item, apiProps.slug);
                let itemId = existingItems[itemSlug] || null;
                let dbFields = {
                    chapterId: 'chapter_id',
                    slug: 'slug',
                    body: 'body',
                    imageUrl: 'image_url',
                    sort: 'sort'
                };
                let values = new ContentValues();
                for (let key in apiProps) {
                    if (apiProps.hasOwnProperty(key) && typeof dbFields[key] !== 'undefined') {
                        values.set(dbFields[key], _.get(item, apiProps[key]));
                    }
                }
                values.set(dbFields.chapterId, chapterDbId);
                let frameSlug = values.get(dbFields.slug);
                let sortValue = null;
                if (typeof frameSlug !== 'undefined') {
                    sortValue = parseInt(frameSlug, 10) || null;
                }
                if (sortValue !== null) {
                    values.set(dbFields.sort, sortValue);
                }
                if (itemId === null) {
                    itemId = db.insert(table, values);
                    existingItems[itemSlug] = itemId;
                } else {
                    db.update(table, values, '`id`=?', [itemId]);
                }
            }
            return true;
        }
        /** /

        _this.indexNotes = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        };

        _this.indexTerms = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        };

        _this.indexQuestions = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        };
        /**/
        //public string retrieval functions
        _this.getProjects = function () {
            let items = db.select('project', 'slug');
            let catalogArray = [];
            if (items !== null) {
                for (let item of items) {
                    catalogArray.push(item[0]);
                }
            }
            return catalogArray;
        };

        _this.getSourceLanguages = function (projectId) {
            let itemId = getProjectDbId(projectId);
            if (itemId === null) {
                return false;
            }
            let items = db.select('source_language', 'slug', '`project_id`=?', [itemId]);
            let catalogArray = [];
            if (items !== null) {
                for (let item of items) {
                    catalogArray.push(item[0]);
                }
            }
            return catalogArray;
        };

        _this.getResources = function (projectId, sourceLanguageId) {
            let itemId = getSourceLanguageDbId(projectId, sourceLanguageId);
            if (itemId === null) {
                return false;
            }
            let items = db.select('resource', 'slug', '`source_language_id`=?', [itemId]);
            let catalogArray = [];
            if (items !== null) {
                for (let item of items) {
                    catalogArray.push(item[0]);
                }
            }
            return catalogArray;
        };

        _this.getChapters = function (projectId, sourceLanguageId, resourceId) {
            let itemId = getResourceDbId(projectId, sourceLanguageId, resourceId);
            if (itemId === null) {
                return false;
            }
            let items = db.select('chapter', 'slug', '`resource_id`=?', [itemId]);
            let catalogArray = [];
            if (items !== null) {
                for (let item of items) {
                    catalogArray.push(item[0]);
                }
            }
            return catalogArray;
        };

        _this.getFrames = function (projectId, sourceLanguageId, resourceId, chapterId) {
            let itemId = getChapterDbId(projectId, sourceLanguageId, resourceId, chapterId);
            if (itemId === null) {
                return false;
            }
            let items = db.select('frame', 'slug', '`chapter_id`=?', [itemId]);
            let catalogArray = [];
            if (items !== null) {
                for (let item of items) {
                    catalogArray.push(item[0]);
                }
            }
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
            let itemId = getProjectDbId(projectId);
            if (itemId === null) {
                return false;
            }
            let dbFields = [
                'modified_at',
                'slug',
                'source_language_catalog_url',
                'sort'
            ];
            let item = db.selectOne('project', dbFields, '`id`=?', [itemId]);
            let catalogObj = {
                dateModified: _.get(item, 'modified_at'),
                slug: _.get(item, 'slug'),
                description: '',
                sourceLanguageCatalog: _.get(item, 'source_language_catalog_url'),
                sort: _.get(item, 'sort')
            };
            return catalogObj;
        };

        _this.getSourceLanguage = function (projectId, sourceLanguageId) {
            let itemId = getSourceLanguageDbId(projectId, sourceLanguageId);
            if (itemId === null) {
                return false;
            }
            let dbFields = [
                'modified_at',
                'project_id',
                'slug',
                'name',
                'direction',
                'project_name',
                'project_description',
                'resource_catalog_url'
            ];
            let item = db.selectOne('source_language', dbFields, '`id`=?', [itemId]);
            let catalogObj = {
                dateModified: _.get(item, 'modified_at'),
                projectId: projectId,
                slug: _.get(item, 'slug'),
                name: _.get(item, 'name'),
                projectName: _.get(item, 'project_name'),
                projectDescription: _.get(item, 'project_description'),
                resourceCatalog: _.get(item, 'resource_catalog_url')
            };
            return catalogObj;
        };

        _this.getResource = function (projectId, sourceLanguageId, resourceId) {
            let itemId = getResourceDbId(projectId, sourceLanguageId, resourceId);
            if (itemId === null) {
                return false;
            }
            let dbFields = [
                'modified_at',
                'source_language_id',
                'slug',
                'name',
                'checking_level',
                'version',
                'source_catalog_url',
                'source_catalog_server_modified_at',
                'translation_notes_catalog_url',
                'translation_notes_catalog_server_modified_at',
                'translation_words_catalog_url',
                'translation_words_catalog_server_modified_at',
                'translation_word_assignments_catalog_url',
                'translation_word_assignments_catalog_server_modified_at',
                'checking_questions_catalog_url',
                'checking_questions_catalog_server_modified_at'
            ];
            let item = db.selectOne('resource', dbFields, '`id`=?', [itemId]);
            let catalogObj = {
                dateModified: _.get(item, 'modified_at'),
                projectId: projectId,
                sourceLanguageId: sourceLanguageId,
                slug: _.get(item, 'slug'),
                name: _.get(item, 'name'),
                checkingLevel: _.get(item, 'checking_level'),
                version: _.get(item, 'version'),
                sourceCatalog: _.get(item, 'source_catalog_url'),
                sourceDateModified: _.get(item, 'source_catalog_server_modified_at'),
                translationNotesCatalog: _.get(item, 'translation_notes_catalog_url'),
                translationNotesDateModified: _.get(item, 'translation_notes_catalog_server_modified_at'),
                translationWordsCatalog: _.get(item, 'translation_words_catalog_url'),
                translationWordsDateModified: _.get(item, 'translation_words_catalog_server_modified_at'),
                translationWordAssignmentsCatalog: _.get(item, 'translation_word_assignments_catalog_url'),
                translationWordAssignmentsDateModified: _.get(item, 'translation_word_assignments_catalog_server_modified_at'),
                checkingQuestionsCatalog: _.get(item, 'checking_questions_catalog_url'),
                checkingQuestionsDateModified: _.get(item, 'checking_questions_catalog_server_modified_at')
            };
            return catalogObj;
        };

        _this.getChapter = function (projectId, sourceLanguageId, resourceId, chapterId) {
            let itemId = getChapterDbId(projectId, sourceLanguageId, resourceId, chapterId);
            if (itemId === null) {
                return false;
            }
            let dbFields = [
                'resource_id',
                'slug',
                'reference',
                'title',
                'sort'
            ];
            let item = db.selectOne('chapter', dbFields, '`id`=?', [itemId]);
            let catalogObj = {
                projectId: projectId,
                sourceLanguageId: sourceLanguageId,
                resourceId: resourceId,
                slug: _.get(item, 'slug'),
                reference: _.get(item, 'reference'),
                title: _.get(item, 'title'),
                sort: _.get(item, 'sort')
            };
            return catalogObj;
        };

        _this.getFrame = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let itemId = getFrameDbId(projectId, sourceLanguageId, resourceId, chapterId, frameId);
            if (itemId === null) {
                return false;
            }
            let dbFields = [
                'chapter_id',
                'slug',
                'body',
                'image_url',
                'sort'
            ];
            let item = db.selectOne('frame', dbFields, '`id`=?', [itemId]);
            let catalogObj = {
                projectId: projectId,
                sourceLanguageId: sourceLanguageId,
                resourceId: resourceId,
                chapterId: chapterId,
                slug: _.get(item, 'slug'),
                body: _.get(item, 'body'),
                imageUrl: _.get(item, 'image_url'),
                sort: _.get(item, 'sort')
            };
            return catalogObj;
        };
        /** /

        _this.getNotes = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let catalogJson = {};
            return catalogJson;
        };

        _this.getTerms = function (projectId, sourceLanguageId, resourceId) {
            let catalogJson = {};
            return catalogJson;
        };

        _this.getQuestions = function (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let catalogJson = {};
            return catalogJson;
        };
        /**/

        return _this;
    }

    exports.Indexer = Indexer;
}());
