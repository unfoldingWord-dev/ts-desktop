// indexer module

;(function () {
    'use strict';

    let url = require('url');
    let _ = require('lodash');
    let Db = require('../js/lib/db').Db;
    let TargetLanguage = require('../js/core/targetlanguage');
    let SourceLanguage = require('../js/core/sourcelanguage');
    let SourceTranslation = require('../js/core/sourcetranslation');
    let Resource = require('../js/core/resource');
    let Project = require('../js/core/project');
    let Chapter = require('../js/core/chapter');
    let Frame = require('../js/core/frame');
    let TranslationNote = require('../js/core/translationnote');
    let TranslationWord = require('../js/core/translationword');
    let CheckingQuestion = require('../js/core/checkingquestion');
    let ProjectCategory = require('../js/core/projectcategory');
    let ContentValues = require('../js/lib/content-values').ContentValues;

    let apiVersion = 2;

    /**
     * Injects parameters into query
     *
     * @param query
     * @param args
     * @returns {*}
     */
    function prepare(query, args) {
        if(typeof query === 'string') {
            for (let arg of args) {
                arg = typeof arg === 'string' ? "'" + arg + "'" : arg;
                query = query.replace(/\?/, arg);
            }
            return query;
        } else {
            throw new Error('the query must be a string');
        }
    }

    function zipper (r) {
        return r.length ? _.map(r[0].values, _.zipObject.bind(_, r[0].columns)) : [];
    }

    /**
     *
     * @param dbPath the path to the database used by the indexer
     * @returns {Indexer}
     * @constructor
     */
    function Indexer (schemaPath, dbPath) {
        if(schemaPath === undefined || dbPath === undefined) {
            throw new Error('Invalid parameters');
        }

        let _this = this;
        _this.needsDbSave = 0;

        let db = new Db(schemaPath, dbPath);
        _this.db = db;

        /**
         * Returns the database id of the project
         * @param projectSlug
         * @returns {int} 0 if no record was found
         */
        function getProjectDbId (projectSlug) {
            let results = zipper(db(prepare('SELECT `id` FROM `project` WHERE `slug`=?', [projectSlug])));
            if (results.length > 0) {
                return results[0].id;
            } else {
                return 0;
            }
        }

        /**
         * Returns the database id of the source language
         * @param projectSlug
         * @param sourceLanguageSlug
         * @returns {int} 0 if no record was found
         */
        function getSourceLanguageDbId (projectSlug, sourceLanguageSlug) {
            let projectDbId = getProjectDbId(projectSlug);
            let results = zipper(db(prepare('SELECT `id` FROM source_language WHERE `slug`=? AND `project_id`=?', [sourceLanguageSlug, projectDbId])));
            if (results.length > 0) {
                return results[0].id;
            } else {
                return 0;
            }
        }

        /**
         * Returns the database id of a resource
         *
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @returns {int} 0 if no record was found
         */
        function getResourceDbId (projectId, sourceLanguageId, resourceId) {
            let sourceLanguageDbId = getSourceLanguageDbId(projectId, sourceLanguageId);
            let results = zipper(db(prepare('SELECT `id` FROM resource WHERE `slug`=? AND `source_language_id`=?', [resourceId, sourceLanguageDbId])));
            if (results.length > 0) {
                return results[0].id;
            } else {
                return 0;
            }
        }

        /**
         * Returns the database id of a chapter
         *
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @param chapterId
         * @returns {int} 0 if no record was found
         */
        function getChapterDbId (projectId, sourceLanguageId, resourceId, chapterId) {
            let resourceDbId = getResourceDbId(projectId, sourceLanguageId, resourceId);
            let results = zipper(db(prepare('SELECT `id` FROM chapter WHERE `slug`=? AND `resource_id`=?', [chapterId, resourceDbId])));
            if (results.length > 0) {
                return results[0].id;
            } else {
                return 0;
            }
        }

        /**
         * Returns the database id of a frame
         *
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @param chapterId
         * @param frameId
         * @returns {int} 0 if no record was found
         */
        function getFrameDbId (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let chapterDbId = getChapterDbId(projectId, sourceLanguageId, resourceId, chapterId);
            let results = zipper(db(prepare('SELECT `id` FROM frame WHERE `slug`=? AND `chapter_id`=?', [frameId, chapterDbId])));
            if (results.length > 0) {
                return results[0].id;
            } else {
                return 0;
            }
        }

        /**
         * Destroys the entire index
         */
        _this.destroy = function () {
            // todo close the database
            // todo delete the database
        };

        /**
         * Rebuilds the index database
         */
        _this.rebuild = function () {
            // todo rebuild the database
        };

        _this.getIndexPath = function () {
            return dbPath;
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
            let results = zipper(db('SELECT `slug`, `id` FROM ' + table));
            if (results !== null) {
                for (let result of results) {
                    existingItems[_.get(result, 'slug')] = _.get(result, 'id');
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
                let query = "INSERT INTO `" + table + "` (";

                let values = [];
                for (let key in apiProps) {
                    if (apiProps.hasOwnProperty(key) && typeof dbFields[key] !== 'undefined') {
                        query += dbFields[key] + ',';
                        values.push(_.get(item, apiProps[key]));
                    }
                }
                query = query.replace(/,$/, '') + ') VALUES (';
                for(let v of values) {
                    query += '?,';
                }
                query = query.replace(/,$/, '') + ')';

                if (itemId === null) {
                    itemId = zipper(db(prepare(query, values)));
                    existingItems[itemSlug] = itemId;
                } else {
                    db.update(table, values, '`id`=?', [itemId]);
                }

                //reset relational links
                db(prepare('DELETE FROM `' + table + '__category ` WHERE `' + table + '_id`=?', [itemId]));
                // db.delete(table + '__category', '`' + table + '_id`=?', [itemId]);

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

        /**
         *
         * @param sourceTranslation {SourceTranslation}
         * @param catalog
         */
        _this.indexTranslationNotes = function(sourceTranslation, catalog) {
            // avoid linting errors temporarily
            sourceTranslation = sourceTranslation;
            catalog = catalog;

            // todo format object and index
            return true;
        };

        _this.indexTranslationWords = function(sourceTranslation, catalog) {
            // avoid linting errors temporarily
            sourceTranslation = sourceTranslation;
            catalog = catalog;

            // todo format object and index
            return true;
        };

        _this.indexTranslationWordAssignments = function(sourceTranslation, catalog) {
            // avoid linting errors temporarily
            sourceTranslation = sourceTranslation;
            catalog = catalog;

            // todo format object and index
            return true;
        };

        _this.indexCheckingQuestions = function(sourceTranslation, catalog) {
            // avoid linting errors temporarily
            sourceTranslation = sourceTranslation;
            catalog = catalog;

            // todo format object and index
            return true;
        };


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
                    sourceServerDateModified: 'source_catalog_server_modified_at',
                    translationNotesCatalog: 'translation_notes_catalog_url',
                    translationNotesServerDateModified: 'translation_notes_catalog_server_modified_at',
                    translationWordsCatalog: 'translation_words_catalog_url',
                    translationWordsServerDateModified: 'translation_words_catalog_server_modified_at',
                    translationWordAssignmentsCatalog: 'translation_word_assignments_catalog_url',
                    translationWordAssignmentsServerDateModified: 'translation_word_assignments_catalog_server_modified_at',
                    checkingQuestionsCatalog: 'checking_questions_catalog_url',
                    checkingQuestionsServerDateModified: 'checking_questions_catalog_server_modified_at'
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
                        values.set(dbFields[dateField + 'ServerDateModified'], dateValue);
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

        _this.indexTranslationNotes = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        };

        _this.indexTranslationWords = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        };

        _this.indexTranslationWordAssignments = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        };

        _this.indexCheckinggit statusQuestions = function (projectId, sourceLanguageId, resourceId, catalogJson) {
        };
        /**/

        /**
         * Returns an array of project slugs
         * @returns {string[]}
         */
        _this.getProjectSlugs = function() {
            let items = zipper(db(prepare('SELECT `slug` FROM `project` ORDER BY `sort` ASC', [])));
            let slugs = [];
            if(items !== null) {
                for(let item of items) {
                    slugs.push(_.get(item, 'slug'));
                }
            }
            return slugs;
        };

        /**
         * Returns an array of projects in the index.
         * If the provided source language cannot be found it will default first to english then to the first available language
         * @param sourceLanguageSlug the source language that will be used to retrieve the project name and description
         * @returns {Project[]}
         */
        _this.getProjects = function (sourceLanguageSlug) {
            let query = "SELECT `p`.`slug`, `p`.`sort`, `p`.`modified_at`, `p`.`source_language_catalog_url`," +
                " COALESCE(`sl1`.`slug`, `sl2`.`slug`, `sl3`.`slug`) AS `source_language_slug`," +
                " COALESCE(`sl1`.`project_name`, `sl2`.`project_name`, `sl3`.`project_name`) AS `name`," +
                " COALESCE(`sl1`.`project_description`, `sl2`.`project_description`, `sl3`.`project_description`) AS `description`," +
                " `p`.`source_language_catalog_local_modified_at`, `p`.`source_language_catalog_server_modified_at`" +
                " FROM `project` AS `p`" +
                " LEFT JOIN `source_language` AS `sl1` ON `sl1`.`project_id`=`p`.`id` AND `sl1`.`slug`=?" +
                " LEFT JOIN `source_language` AS `sl2` ON `sl2`.`project_id`=`p`.`id` AND `sl2`.`slug`='en'" +
                " LEFT JOIN `source_language` AS `sl3` ON `sl3`.`project_id`=`p`.`id`" +
                " GROUP BY `p`.`id`" +
                " ORDER BY `p`.`sort` ASC";
            let items = zipper(db(prepare(query, [sourceLanguageSlug])));
            let projects = [];
            for (let item of items) {
                projects.push(Project.newInstance({
                    slug: _.get(item, 'slug'),
                    sort: _.get(item, 'sort'),
                    dateModified: _.get(item, 'modified_at'),
                    sourceLanguageCatalog: _.get(item, 'source_language_catalog_url'),
                    sourceLanguageSlug: _.get(item, 'source_language_slug'),
                    name: _.get(item, 'name'),
                    description: _.get(item, 'description'),
                    sourceLanguageCatalogLocalDateModified: _.get(item, 'source_language_catalog_local_modified_at'),
                    sourceLanguageCatalogServerDateModified: _.get(item, 'source_language_catalog_server_modified_at')
                }));
            }
            return projects;
        };

        /**
         * Returns an array of source languages
         *
         * @param projectSlug
         * @returns {SourceLanguage[]}
         */
        _this.getSourceLanguages = function (projectSlug) {
            if(projectSlug === null || projectSlug === undefined) {
                return [];
            }
            let query = "SELECT `sl`.`slug`, `sl`.`name`, `sl`.`project_name`, `sl`.`project_description`," +
                " `sl`.`direction`, `sl`.`modified_at`, `sl`.`resource_catalog_url`," +
                " `sl`.`resource_catalog_local_modified_at`, `sl`.`resource_catalog_server_modified_at`" +
                " FROM `source_language` AS `sl`" +
                " LEFT JOIN `project` AS `p` ON `p`.`id` = `sl`.`project_id`" +
                " WHERE `p`.`slug`=?";

            let items = zipper(db(prepare(query, [projectSlug])));
            let sourceLanguages = [];
            if (items !== null) {
                for (let item of items) {
                    sourceLanguages.push(SourceLanguage.newInstance({
                        code: _.get(item, 'slug'),
                        name: _.get(item, 'name'),
                        projectName: _.get(item, 'project_name'),
                        projectDescription: _.get(item, 'project_description'),
                        direction: _.get(item, 'direction'),
                        dateModified: _.get(item, 'modified_at'),
                        resourceCatalog: _.get(item, 'resource_catalog_url'),
                        resourceCatalogLocalDateModified: _.get(item, 'resource_catalog_local_modified_at'),
                        resourceCatalogServerDateModified: _.get(item, 'resource_catalog_server_modified_at')
                    }));
                }
            }
            return sourceLanguages;
        };

        /**
         * Returns an array of resource slugs
         * @param projectSlug
         * @param sourceLanguageSlug
         * @returns {string[]}
         */
        _this.getResourceSlugs = function (projectSlug, sourceLanguageSlug) {
            let sourceLanguageId = getSourceLanguageDbId(projectSlug, sourceLanguageSlug);
            if(sourceLanguageId === null) {
                return [];
            }
            let query = "SELECT `slug` FROM `resource` WHERE `source_language_id`=? ORDER BY `slug` ASC";
            let items = zipper(db(prepare(query, [sourceLanguageId])));
            let slugs = [];
            for(let item of items) {
                slugs.put(_.get(item, 'slug'));
            }
            return slugs;
        };

        /**
         * Returns the resources in a source language
         * @param projectSlug
         * @param sourceLanguageSlug
         * @returns {Resource[]}
         */
        _this.getResources = function (projectSlug, sourceLanguageSlug) {
            let query = "SELECT `r`.`name`, `r`.`checking_level`, `r`.`version`, `r`.`modified_at`," +
            " `r`.`source_catalog_url`, `r`.`source_catalog_local_modified_at`, `r`.`source_catalog_server_modified_at`," +
            " `r`.`translation_notes_catalog_url`, `r`.`translation_notes_catalog_local_modified_at`, `r`.`translation_notes_catalog_server_modified_at`," +
            " `r`.`translation_words_catalog_url`, `r`.`translation_words_catalog_local_modified_at`, `r`.`translation_words_catalog_server_modified_at`," +
            " `r`.`translation_word_assignments_catalog_url`, `r`.`translation_word_assignments_catalog_local_modified_at`, `r`.`translation_word_assignments_catalog_server_modified_at`," +
            " `r`.`checking_questions_catalog_url`, `r`.`checking_questions_catalog_local_modified_at`, `r`.`checking_questions_catalog_server_modified_at`," +
            " `r`.`id`, CASE WHEN `content`.`count` > 0 THEN 1 ELSE 0 END AS `is_downloaded`, `r`.`slug` FROM `resource` AS `r`" +
            " LEFT JOIN `source_language` AS `sl` ON `sl`.`id`=`r`.`source_language_id`" +
            " LEFT JOIN `project` AS `p` ON `p`.`id` = `sl`.`project_id`" +
            " LEFT JOIN (" +
            "   SELECT `r`.`id` AS `resource_id`, COUNT(*) AS `count` FROM `chapter` AS `c`" +
            "   LEFT JOIN `resource` AS `r` ON `r`.`id`=`c`.`resource_id`" +
            "   GROUP BY `r`.`id`" +
            " ) AS `content` ON `content`.`resource_id`=`r`.`id`" +
            " WHERE `p`.`slug`=? AND `sl`.`slug`=?";

            let items = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug])));
            let resources = [];
            for (let item of items) {
                let resource = Resource.newInstance({
                    name: _.get(item, 'name'),
                    checkingLevel: _.get(item, 'checking_level'),
                    version: _.get(item, 'version'),
                    dateModified: _.get(item, 'modified_at'),
                    sourceCatalog: _.get(item, 'source_catalog_url'),
                    sourceLocalDateModified: _.get(item, 'source_catalog_local_modified_at'),
                    sourceServerDateModified: _.get(item, 'source_catalog_server_modified_at'),
                    notesCatalog: _.get(item, 'translation_notes_catalog_url'),
                    notesLocalDateModified: _.get(item, 'translation_notes_catalog_local_modified_at'),
                    notesServerDateModified: _.get(item, 'translation_notes_catalog_server_modified_at'),
                    wordsCatalog: _.get(item, 'translation_words_catalog_url'),
                    wordsLocalDateModified: _.get(item, 'translation_words_catalog_local_modified_at'),
                    wordsServerDateModified: _.get(item, 'translation_words_catalog_server_modified_at'),
                    wordAssignmentsCatalog: _.get(item, 'translation_word_assignments_catalog_url'),
                    wordAssignmentsLocalDateModified: _.get(item, 'translation_word_assignments_catalog_local_modified_at'),
                    wordAssignmentsServerDateModified: _.get(item, 'translation_word_assignments_catalog_server_modified_at'),
                    questionsCatalog: _.get(item, 'checking_questions_catalog_url'),
                    questionsLocalDateModified: _.get(item, 'checking_questions_catalog_local_modified_at'),
                    questionsServerDateModified: _.get(item, 'checking_questions_catalog_server_modified_at'),
                    isDownloaded: _.get(item, 'is_downloaded'),
                    slug: _.get(item, 'slug')
                });
                resource.setDBId(_.get(item, 'id'));
                resources.push(resource);
            }
            return resources;
        };

        /**
         * Returns an array of chapters
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @returns {Chapter[]}
         */
        _this.getChapters = function (projectSlug, sourceLanguageSlug, resourceSlug) {
            // TODO: this should all be in one query.. we need to update the schema to place the slugs in the chapter table.
            let itemId = getResourceDbId(projectSlug, sourceLanguageSlug, resourceSlug);
            if (itemId === null) {
                return [];
            }

            let items = zipper(db(prepare('SELECT `slug`, `reference`, `title` FROM chapter WHERE `resource_id`=?', [itemId])));
            let chapters = [];
            if (items !== null) {
                for (let item of items) {
                    chapters.push(Chapter.newInstance(item));
                }
            }
            return chapters;
        };

        /**
         * Returns an array of frame slugs
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @returns {Array}
         */
        _this.getFrameSlugs = function(projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug) {
            let chapterId = getChapterDbId(projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug);
            if(chapterId === null) {
                return [];
            }
            let query = "SELECT `slug` FROM `frame` WHERE `chapter_id`=? ORDER BY `sort` ASC";
            let items = zipper(db(prepare(query, [chapterId])));
            let slugs = [];
            if(items !== null && items.length > 0) {
                for(let item of items) {
                    slugs.push(item[0]);
                }
            }
            return slugs;
        };

        /**
         * Returns an array of frames
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @returns {Frame[]}
         */
        _this.getFrames = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug) {
            let query = "SELECT `f`.`id`, `f`.`slug`, `f`.`body`, `f`.`format`, `f`.`image_url` FROM `frame` AS `f`" +
            " WHERE `f`.`chapter_id` IN (" +
            "   SELECT `c`.`id` FROM `chapter` AS `c`" +
            "   LEFT JOIN `resource` AS `r` ON `r`.`id`=`c`.`resource_id`" +
            "   LEFT JOIN `source_language` AS `sl` ON `sl`.`id`=`r`.`source_language_id`" +
            "   LEFT JOIN `project` AS `p` ON `p`.`id`=`sl`.`project_id`" +
            "   WHERE `p`.`slug`=? AND `sl`.`slug`=? AND `r`.`slug`=? AND `c`.`slug`=?" +
            " ) ORDER BY `f`.`sort` ASC";

            let items = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug])));
            let frames = [];
            for (let item of items) {
                let frame = Frame.newInstance({
                    slug: _.get(item, 'slug'),
                    chapterSlug: chapterSlug,
                    body: _.get(item, 'body'),
                    translationFormat: _.get(item, 'format'),
                    imageUrl: _.get(item, 'image_url')
                });
                frame.setDBId(_.get(item, 'id'));
                frames.push(frame);
            }
            return frames;
        };

        /**
         * Returns an array of project categories underneath the parent category id
         * @param sourceLanguageSlug
         * @param parentCategoryId
         * @return {ProjectCategory[]}
         */
        _this.getCategoryBranch = function(sourceLanguageSlug, parentCategoryId) {
            let query = "SELECT * FROM (" +
                " SELECT `c`.`slug` AS `category_slug`, `slc`.`category_name` AS `title`, NULL AS `project_slug`, 0 AS `sort`, `c`.`id` AS `category_id` FROM `category` AS `c`" +
                " LEFT JOIN `source_language__category` AS `slc` ON `slc`.`category_id`=`c`.`id`" +
                " LEFT JOIN `source_language` AS `sl` ON `sl`.`id`=`slc`.`source_language_id`" +
                " WHERE `sl`.`slug`=? AND `c`.`parent_id`=" + parentCategoryId +
                " UNION" +
                " SELECT `c`.`slug` AS `category_slug`, `sl`.`project_name` AS `title`, `p`.`slug` AS `project_id`, `p`.`sort` AS `sort`, " + parentCategoryId + " AS `category_id` FROM `project` AS `p`" +
                " LEFT JOIN `project__category` AS `pc` ON `pc`.`project_id`=`p`.`id`" +
                " LEFT JOIN `category` AS `c` ON `c`.`id`=`pc`.`category_id`" +
                " LEFT JOIN `source_language` AS `sl` ON `sl`.`project_id`=`p`.`id`" +
                " WHERE CASE WHEN " + parentCategoryId + "=0 THEN `pc`.`category_id` IS NULL ELSE `pc`.`category_id`=" + parentCategoryId + " END AND `sl`.`slug`=?" +
                ") ORDER BY `sort` ASC";
            let items = zipper(db(prepare(query, [sourceLanguageSlug, sourceLanguageSlug])));
            let projectCategories = [];
            if(items !== null && items.length > 0) {
                for(let item of items) {
                    projectCategories.push(ProjectCategory.newInstance({
                        categorySlug:_.get(item, 'category_slug'),
                        title:_.get(item, 'category_name'),
                        projectSlug:_.get(item, 'project_slug'),
                        parentCategoryId:_.get(item, 'category_id')
                    }));
                }
            }
            return projectCategories;
        };

        /**
         * Returns a singel target language
         * @param targetLanguageSlug
         * @returns {TargetLanguage}
         */
        _this.getTargetLanguage = function(targetLanguageSlug) {
            let items = zipper(db(prepare('SELECT `slug` AS `code`, `name`, `direction`, `region` FROM target_language WHERE slug=?', [targetLanguageSlug])));
            let targetLanguage = null;
            if(items.length > 0) {
                targetLanguage = TargetLanguage.newInstance(items[0]);
            }
            return targetLanguage;
        };

        /**
         * Returns an array of target languages
         * @returns {TargetLanguage[]}
         */
        _this.getTargetLanguages = function() {
            let items = zipper(db(prepare('SELECT `slug` AS `code`, `name`, `direction`, `region` FROM target_language', [])));
            let targetLanguages = [];
            if (items !== null) {
                for (let item of items) {
                    targetLanguages.push(TargetLanguage.newInstance(item));
                }
            }
            return targetLanguages;
        };

        /**
         * Returns a project
         * @param projectSlug
         * @param sourceLanguageSlug
         * @returns {Project}
         */
        _this.getProject = function (projectSlug, sourceLanguageSlug) {
            if(projectSlug === null || projectSlug === undefined || sourceLanguageSlug === null || sourceLanguageSlug === undefined) {
                throw new Error('Incorrect or missing parameters');
            }
            let query = "SELECT `p`.`sort`, `p`.`modified_at`, `p`.`source_language_catalog_url`," +
                " COALESCE(`sl1`.`slug`, `sl2`.`slug`, `sl3`.`slug`) AS `source_language_slug`," +
                " COALESCE(`sl1`.`project_name`, `sl2`.`project_name`, `sl3`.`project_name`) AS `name`," +
                " COALESCE(`sl1`.`project_description`, `sl2`.`project_description`, `sl3`.`project_description`) AS `description`," +
                " `p`.`source_language_catalog_local_modified_at`, `p`.`source_language_catalog_server_modified_at`" +
                " FROM `project` AS `p`" +
                " LEFT JOIN `source_language` AS `sl1` ON `sl1`.`project_id`=`p`.`id`AND `sl1`.`slug`=?" +
                " LEFT JOIN `source_language` AS `sl2` ON `sl2`.`project_id`=`p`.`id` AND `sl2`.`slug`='en'" +
                " LEFT JOIN `source_language` AS `sl3` ON `sl3`.`project_id`=`p`.`id`" +
                " WHERE `p`.`slug`=?" +
                " GROUP BY `p`.`id`";

            let results = zipper(db(prepare(query, [sourceLanguageSlug, projectSlug])));
            if(results === null || results.length === 0) {
                return null;
            }
            let item = results[0];
            let project = Project.newInstance({
                slug: projectSlug,
                sort: _.get(item, 'sort'),
                dateModified: _.get(item, 'modified_at'),
                sourceLanguageCatalog: _.get(item, 'source_language_catalog_url'),
                sourceLanguageSlug: _.get(item, 'source_language_slug'),
                name: _.get(item, 'name'),
                description: _.get(item, 'description'),
                sourceLanguageCatalogLocalDateModified: _.get(item, 'source_language_catalog_local_modified_at'),
                sourceLanguageCatalogServerDateModified: _.get(item, 'source_language_catalog_server_modified_at')
            });
            return project;
        };

        /**
         * Returns a source language
         * @param projectId
         * @param sourceLanguageId
         * @returns {SourceLanguage}
         */
        _this.getSourceLanguage = function (projectId, sourceLanguageId) {
            let itemId = getSourceLanguageDbId(projectId, sourceLanguageId);
            if (itemId === null) {
                return null;
            }
            let query = [
                'SELECT `slug` AS `code`, `name`, `project_name` AS `projectName`, `project_description` AS `projectDescription`,',
                '`direction`, `modified_at` AS `dateModified`, `resource_catalog_url` AS `resourceCatalogUrl`,',
                '`resource_catalog_local_modified_at` AS `resourceCatalogLocalDateModified`,',
                ' `resource_catalog_server_modified_at` AS `resourceCatalogServerDateModified` FROM `source_language`',
                'WHERE `id`=?'
            ].join(' ');
            let items = zipper(db(prepare(query, [itemId])));
            if(items.length > 0) {
                return SourceLanguage.newInstance(items[0]);
            } else {
                return null;
            }
        };

        /**
         * Returns a single resource
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @returns {Resource}
         */
        _this.getResource = function (projectId, sourceLanguageId, resourceId) {
            let itemId = getResourceDbId(projectId, sourceLanguageId, resourceId);
            if (itemId === null) {
                return null;
            }
            let query = [
                'SELECT `modified_at`,',
                '`source_language_id`,',
                '`slug`,',
                '`name`,',
                '`checking_level`,',
                '`version`,',
                '`source_catalog_url`,',
                '`source_catalog_local_modified_at`,',
                '`source_catalog_server_modified_at`,',
                '`translation_notes_catalog_url`,',
                '`translation_notes_catalog_local_modified_at`,',
                '`translation_notes_catalog_server_modified_at`,',
                '`translation_words_catalog_url`,',
                '`translation_words_catalog_local_modified_at`,',
                '`translation_words_catalog_server_modified_at`,',
                '`translation_word_assignments_catalog_url`,',
                '`translation_word_assignments_catalog_local_modified_at`,',
                '`translation_word_assignments_catalog_server_modified_at`,',
                '`checking_questions_catalog_url`,',
                '`checking_questions_catalog_local_modified_at`,',
                '`checking_questions_catalog_server_modified_at`',
                'FROM `resource` WHERE `id`=?'
            ].join(' ');
            let items = zipper(db(prepare(query, [itemId])));
            if(items.length > 0) {
                let item = items[0];
                return Resource.newInstance({
                    dateModified: _.get(item, 'modified_at'),
                    projectId: projectId,
                    sourceLanguageId: sourceLanguageId,
                    slug: _.get(item, 'slug'),
                    name: _.get(item, 'name'),
                    checkingLevel: _.get(item, 'checking_level'),
                    version: _.get(item, 'version'),
                    sourceCatalog: _.get(item, 'source_catalog_url'),
                    sourceLocalDateModified: _.get(item, 'source_catalog_local_modified_at'),
                    sourceServerDateModified: _.get(item, 'source_catalog_server_modified_at'),
                    translationNotesCatalog: _.get(item, 'translation_notes_catalog_url'),
                    translationNotesLocalDateModified: _.get(item, 'translation_notes_catalog_local_modified_at'),
                    translationNotesServerDateModified: _.get(item, 'translation_notes_catalog_server_modified_at'),
                    translationWordsCatalog: _.get(item, 'translation_words_catalog_url'),
                    translationWordsLocalDateModified: _.get(item, 'translation_words_catalog_local_modified_at'),
                    translationWordsServerDateModified: _.get(item, 'translation_words_catalog_server_modified_at'),
                    translationWordAssignmentsCatalog: _.get(item, 'translation_word_assignments_catalog_url'),
                    translationWordAssignmentsLocalDateModified: _.get(item, 'translation_word_assignments_catalog_local_modified_at'),
                    translationWordAssignmentsServerDateModified: _.get(item, 'translation_word_assignments_catalog_server_modified_at'),
                    checkingQuestionsCatalog: _.get(item, 'checking_questions_catalog_url'),
                    checkingQuestionsLocalDateModified: _.get(item, 'checking_questions_catalog_local_modified_at'),
                    checkingQuestionsServerDateModified: _.get(item, 'checking_questions_catalog_server_modified_at')
                });
            } else {
                return null;
            }
        };

        /**
         * Returns a single chapter from a resource
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @param chapterId
         * @returns {Chapter}
         */
        _this.getChapter = function (projectId, sourceLanguageId, resourceId, chapterId) {
            let itemId = getChapterDbId(projectId, sourceLanguageId, resourceId, chapterId);
            if (itemId === null) {
                return null;
            }
            let items = zipper(db(prepare('SELECT `slug`, `reference`, `title` FROM chapter WHERE `id`=?', [itemId])));
            if(items.length > 0) {
                return Chapter.newInstance(items[0]);
            } else {
                return null;
            }
        };

        /**
         * Returns the body of a chapter
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @returns {string}
         */
        _this.getChapterBody = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug) {
            let query = "SELECT GROUP_CONCAT(`f`.`body`, ' ') AS `body` FROM `frame` AS `f`" +
            " LEFT JOIN `chapter` AS `c` ON `c`.`id`=`f`.`chapter_id`" +
            " LEFT JOIN `resource` AS `r` ON `r`.`id`=`c`.`resource_id`" +
            " LEFT JOIN `source_language` AS `sl` ON `sl`.`id`=`r`.`source_language_id`" +
            " LEFT JOIN `project` AS `p` ON `p`.`id`=`sl`.`project_id`" +
            " WHERE `p`.`slug`=? AND `sl`.`slug`=? AND `r`.`slug`=? AND `c`.`slug`=? ORDER BY `c`.`sort`, `f`.`sort` ASC";
            let items = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug])));
            if(items.length > 0) {
                return items[0].body;
            } else {
                return '';
            }
        };

        /**
         * Returns the translation format of the chapter body
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @returns {string}
         */
        _this.getChapterBodyFormat = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug) {
            let query = "SELECT `f`.`format` FROM `frame` AS `f`" +
                " WHERE `f`.`chapter_id` IN (" +
                "   SELECT `c`.`id` FROM `chapter` AS `c`" +
                "   LEFT JOIN `resource` AS `r` ON `r`.`id`=`c`.`resource_id`" +
                "   LEFT JOIN `source_language` AS `sl` ON `sl`.`id`=`r`.`source_language_id`" +
                "   LEFT JOIN `project` AS `p` ON `p`.`id`=`sl`.`project_id`" +
                "   WHERE `p`.`slug`=? AND `sl`.`slug`=? AND `r`.`slug`=? AND `c`.`slug`=?" +
                " ) AND `f`.`format` IS NOT NULL LIMIT 1";
            let result = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug])));
            if(result !== null && result.length > 0) {
                return result[0].format;
            }
            return 'default';
        };

        /**
         * Returns a single frame from a resource
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @param frameSlug
         * @returns {Frame}
         */
        _this.getFrame = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug) {
            let itemId = getFrameDbId(projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug);
            if (itemId === null) {
                return null;
            }
            let items = zipper(db(prepare('SELECT `body`, `image_url`, `format` FROM frame WHERE `id`=?', [itemId])));
            if(items.length > 0) {
                let item = items[0];
                let frame = Frame.newInstance({
                    slug: frameSlug,
                    chapterSlug: chapterSlug,
                    body: _.get(item, 'body'),
                    imageUrl: _.get(item, 'image_url'),
                    translationFormat: _.get(item, 'format')
                });
                frame.setDBId(itemId);
                return frame;
            } else {
                return null;
            }
        };

        /**
         * Returns an array of translation notes
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @param frameSlug
         * @returns {TranslationNote[]}
         */
        _this.getTranslationNotes = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug) {
            let query = "SELECT `slug`, `title`, `body` FROM `translation_note`" +
                " WHERE `project_slug`=? AND `source_language_slug`=?" +
                " AND `resource_slug`=? AND `chapter_slug`=? AND `frame_slug`=?";
            let items = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug])));
            let translationNotes = [];
            if(items !== null) {
                for (let item of items) {
                    let note = TranslationNote.newInstance(item);
                    translationNotes.push(note);
                }
            }
            return translationNotes;
        };


        /**
         * Returns an array of translation words
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @param frameSlug
         * @returns {TranslationWord[]}
         */
        _this.getTranslationWordsForFrame = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug) {
            let query = "SELECT `id`, `slug`, `term`, `definition`, `definition_title` FROM `translation_word`" +
            " WHERE `id` IN (" +
            "   SELECT `translation_word_id` FROM `frame__translation_word`" +
            "   WHERE `project_slug`=? AND `source_language_slug`=? AND `resource_slug`=? AND `chapter_slug`=? AND `frame_slug`=?" +
            " ) ORDER BY `slug` DESC";
            let items = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug])));
            let translationWords = [];
            if(items !== null) {
                for (let item of items) {
                    // NOTE: we purposely do not retrieve the related terms, aliases and example passages for better performance
                    let word = TranslationWord.newInstance({
                        slug: _.get(item, 'slug'),
                        term: _.get(item, 'term'),
                        definition: _.get(item, 'definition'),
                        definitionTitle: _.get(item, 'definition_title'),
                        seeAlso: [],
                        aliases: [],
                        examples: []
                    });
                    translationWords.push(word);
                }
            }
            return translationWords;
        };

        /**
         * Returns a checking question
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @param frameSlug
         * @param questionSlug
         * @returns {CheckingQuestion}
         */
        _this.getCheckingQuestion = function(projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug, questionSlug) {
            let chapterId = getChapterDbId(projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug);
            if (chapterId === null) {
                return null;
            }

            let query = "SELECT `c`.`slug`, `cq`.`question`, `cq`.`answer`, `ref`.`references` FROM `checking_question` AS `cq`" +
                " LEFT JOIN (" +
                "   SELECT `checking_question_id`, GROUP_CONCAT(`chapter_slug` || '-' || `frame_slug`, ',') AS `references` FROM `frame__checking_question`" +
                "   GROUP BY `checking_question_id`" +
                " ) AS `ref` ON `ref`.`checking_question_id`=`cq`.`id`" +
                " LEFT JOIN `frame__checking_question` AS `fcq` ON `fcq`.`checking_question_id`=`cq`.`id`" +
                " LEFT JOIN `frame` AS `f` ON `f`.`id`=`fcq`.`frame_id`" +
                " LEFT JOIN `chapter` AS `c` ON `c`.`id`=`f`.`chapter_id`" +
                " WHERE `f`.`slug`=? AND `cq`.`slug`=? AND `c`.`id`=?";
            let results = zipper(db(prepare(query, [frameSlug, questionSlug, chapterId])));
            let question = null;
            if(results.length > 0) {
                let item = results[0];
                let questionText = _.get(item, 'question');
                let answer = _.get(item, 'answer');
                let referenceStrings = _.get(item, 'references').split(',');
                let references = [];
                for(let reference of referenceStrings) {
                    try {
                        references.push(CheckingQuestion.generateReference(reference));
                    } catch (e) {
                        // todo: log the error
                    }
                }
                question = CheckingQuestion.newInstance({
                    slug:questionSlug,
                    chapterSlug:chapterSlug,
                    frameSlug:frameSlug,
                    question:questionText,
                    answer:answer,
                    references:references
                });
            }
            return question;
        };

        /**
         * Returns an array of checking questions
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @param frameSlug
         * @returns {CheckingQuestion[]}
         */
        _this.getCheckingQuestions = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug) {
            let query = [
                "SELECT `slug`, `question`, `answer` FROM `checking_question`",
                "WHERE `id` IN (",
                " SELECT `checking_question_id` FROM `frame__checking_question`",
                " WHERE `project_slug`=? AND `source_language_slug`=? AND `resource_slug`=? AND `chapter_slug`=? AND `frame_slug`=?",
                ")"].join(' ');
            let items = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug])));
            let checkingQuestions = [];
            if(items !== null) {
                for (let item of items) {
                    // NOTE: we purposely do not retrieve references in the above query for better performance
                    let question = CheckingQuestion.newInstance({
                        slug: _.get(item, 'slug'),
                        chapterSlug: chapterSlug,
                        frameSlug: frameSlug,
                        question: _.get(item, 'question'),
                        answer: _.get(item, 'answer'),
                        references: []
                    });
                    checkingQuestions.push(question);
                }
            }
            return checkingQuestions;
        };

        /**
         * Returns a source translation
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @returns {SourceTranslation}
         */
        _this.getSourceTranslation = function(projectSlug, sourceLanguageSlug, resourceSlug) {
            let sourceTranslation = null;
            let query = "SELECT `sl`.`project_name` AS `project_name`, `sl`.`name` AS `source_language_name`, `r`.`name` AS `resource_name`, `r`.`checking_level`, `r`.`modified_at`, `r`.`version`" +
            " FROM `resource` AS `r`" +
            " LEFT JOIN `source_language` AS `sl` ON `sl`.`id`=`r`.`source_language_id`" +
            " LEFT JOIN `project` AS `p` ON `p`.`id` = `sl`.`project_id`" +
            " WHERE `p`.`slug`=? AND `sl`.`slug`=? AND `r`.`slug`=?";
            let results = zipper(db(prepare(query, [projectSlug, sourceLanguageSlug, resourceSlug])));
            if(results.length > 0) {
                let item = results[0];
                sourceTranslation = SourceTranslation.newInstance({
                    projectSlug:projectSlug,
                    sourceLanguageSlug:sourceLanguageSlug,
                    resourceSlug:resourceSlug,
                    projectTitle:_.get(item, 'project_name'),
                    sourceLanguageTitle:_.get(item, 'source_language_name'),
                    resourceTitle:_.get(item, 'resource_name'),
                    checkingLevel:_.get(item, 'checking_level'),
                    dateModified:_.get(item, 'modified_at'),
                    version:_.get(item, 'version')
                });
            }
            return sourceTranslation;
        };

        return _this;
    }

    exports.Indexer = Indexer;
}());
