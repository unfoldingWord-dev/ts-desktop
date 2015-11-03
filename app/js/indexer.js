// indexer module

;(function () {
    'use strict';

    //let md5 = require('md5');
    let url = require('url');
    let _ = require('lodash');
    let Db = require('./lib/db').Db;
    let TargetLanguage = require('./core/targetlanguage');
    let SourceLanguage = require('./core/sourcelanguage');
    let SourceTranslation = require('./core/sourcetranslation');
    let Resource = require('./core/resource');
    let Project = require('./core/project');
    let Chapter = require('./core/chapter');
    let Frame = require('./core/frame');
    let TranslationNote = require('./core/translationnote');
    let TranslationWord = require('./core/translationword');
    let CheckingQuestion = require('./core/checkingquestion');
    let ContentValues = require('./lib/content-values').ContentValues;

    let apiVersion = 2;

    /**
     *
     * @param databasePath the path to the database used by the indexer
     * @returns {Indexer}
     * @constructor
     */
    function Indexer (databasePath) {

        let _this = this;
        _this.needsDbSave = 0;
        let db = new Db(databasePath);

        /**
         * Returns the database id of the project
         * @param projectSlug
         * @returns 0 if no record was found
         */
        function getProjectDbId (projectSlug) {
            let results = db.selectOne('project', 'id', '`slug`=?', [projectSlug]);
            if (typeof results.id === 'undefined') {
                return 0;
            }
            return results.id;
        }

        /**
         * Returns the database id of the source language
         * @param projectSlug
         * @param sourceLanguageSlug
         * @returns 0 if no record was found
         */
        function getSourceLanguageDbId (projectSlug, sourceLanguageSlug) {
            let projectDbId = getProjectDbId(projectSlug);
            let results = db.selectOne('source_language', 'id', '`slug`=? AND `project_id`=?', [sourceLanguageSlug, projectDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        /**
         * Returns the database id of a resource
         *
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @returns 0 if no record was found
         */
        function getResourceDbId (projectId, sourceLanguageId, resourceId) {
            let sourceLanguageDbId = getSourceLanguageDbId(projectId, sourceLanguageId);
            let results = db.selectOne('resource', 'id', '`slug`=? AND `source_language_id`=?', [resourceId, sourceLanguageDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        /**
         * Returns the database id of a chapter
         *
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @param chapterId
         * @returns 0 if no record was found
         */
        function getChapterDbId (projectId, sourceLanguageId, resourceId, chapterId) {
            let resourceDbId = getResourceDbId(projectId, sourceLanguageId, resourceId);
            let results = db.selectOne('chapter', 'id', '`slug`=? AND `resource_id`=?', [chapterId, resourceDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
        }

        /**
         * Returns the database id of a frame
         *
         * @param projectId
         * @param sourceLanguageId
         * @param resourceId
         * @param chapterId
         * @param frameId
         * @returns 0 if no record was found
         */
        function getFrameDbId (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
            let chapterDbId = getChapterDbId(projectId, sourceLanguageId, resourceId, chapterId);
            let results = db.selectOne('frame', 'id', '`slug`=? AND `chapter_id`=?', [frameId, chapterDbId]);
            if (typeof results.id === 'undefined') {
                return null;
            }
            return results.id;
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
            return databasePath;
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

        _this.indexCheckingQuestions = function(sourceTranslation, catalog) {
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

        /**
         * Returns an array of projects in the index
         * @returns {Project[]}
         */
        _this.getProjects = function (sourceLanguageSlug) {
            let query = "SELECT `p`.`slug`, `p`.`sort`, `p`.`modified_at`, `p`.`source_language_catalog_url`," +
                " COALESCE(`sl1`.`slug`, `sl2`.`slug`, `sl3`.`slug`) AS `source_language_slug`," +
                " COALESCE(`sl1`.`project_name`, `sl2`.`project_name`, `sl3`.`project_name`) AS `name`," +
                " COALESCE(`sl1`.`project_description`, `sl2`.`project_description`, `sl3`.`project_description`) AS `description`," +
                " `p`.`source_language_catalog_local_modified_at`, `p`.`source_language_catalog_server_modified_at`" +
                " FROM `project` AS `p`" +
                " LEFT JOIN `source_language` AS `sl1` ON `sl1`.`project_id`=`p`.`id`AND `sl1`.`slug`=?" +
                " LEFT JOIN `source_language` AS `sl2` ON `sl2`.`project_id`=`p`.`id` AND `sl2`.`slug`='en'" +
                " LEFT JOIN `source_language` AS `sl3` ON `sl3`.`project_id`=`p`.`id`" +
                " GROUP BY `p`.`id`" +
                " ORDER BY `p`.`sort` ASC";
            let items = db.selectRaw(query, [sourceLanguageSlug]);
            let projects = [];
            if (items !== null) {
                for (let item of items) {
                    projects.push(Project.newInstance({
                        slug: _.get(item, 'slug'),
                        sourceLanguageSlug: _.get(item, 'source_language_slug'),
                        name: _.get(item, 'name'),
                        description: _.get(item, 'description'),
                        dateModified: _.get(item, 'modified_at'),
                        sort: _.get(item, 'sort'),
                        sourceLanguageCatalog: _.get(item, 'source_language_catalog_url'),
                        sourceLanguageCatalogLocalModifiedAt: _.get(item, 'source_language_catalog_local_modified_at'),
                        sourceLanguageCatalogServerModifiedAt: _.get(item, 'source_language_catalog_server_modified_at')
                    }));
                }
            }
            return projects;
        };

        /**
         * Returns an array of source languages
         * @deprecated
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

            let items = db.selectRaw(query, [projectSlug]);
            let sourceLanguages = [];
            if (items !== null) {
                for (let item of items) {
                    sourceLanguages.push(SourceLanguage.newInstance({
                        code: _.get(item, 'slug'),
                        name: _.get(item, 'name'),
                        projectName: _.get(item, 'project_name'),
                        projectDescription: _.get(item, 'project_description'),
                        dateModified: _.get(item, 'modified_at'),
                        resourceCatalogUrl: _.get(item, 'resource_catalog_url'),
                        resourceCatalogLocalDateModified: _.get(item, 'resource_catalog_local_modified_at'),
                        resourceCatalogServerDateModified: _.get(item, 'resource_catalog_server_modified_at'),
                        direction: _.get(item, 'direction')
                    }));
                }
            }
            return sourceLanguages;
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

            let items = db.selectRaw(query, [projectSlug, sourceLanguageSlug]);
            let resources = [];
            if (items !== null) {
                for (let item of items) {
                    resources.push(Resource.newInstance({
                        name: _.get(item, 'name'),
                        slug: _.get(item, 'slug'),
                        checkingLevel: _.get(item, 'checking_level'),
                        version: _.get(item, 'version'),
                        isDownloaded: _.get(item, 'is_downloaded'),
                        dateModified: _.get(item, 'modified_at'),
                        sourceCatalog: _.get(item, 'source_catalog_url'),
                        sourceDateModified: _.get(item, 'source_catalog_local_modified_at'),
                        sourceServerDateModified: _.get(item, 'source_catalog_server_modified_at'),
                        notesCatalog: _.get(item, 'translation_notes_catalog_url'),
                        notesDateModified: _.get(item, 'translation_notes_catalog_local_modified_at'),
                        notesServerDateModified: _.get(item, 'translation_notes_catalog_server_modified_at'),
                        wordsCatalog: _.get(item, 'translation_words_catalog_url'),
                        wordsDateModified: _.get(item, 'translation_words_catalog_local_modified_at'),
                        wordsServerDateModified: _.get(item, 'translation_words_catalog_server_modified_at'),
                        wordAssignmentsCatalog: _.get(item, 'translation_word_assignments_catalog_url'),
                        wordAssignmentsDateModified: _.get(item, 'translation_word_assignments_catalog_local_modified_at'),
                        wordAssignmentsServerDateModified: _.get(item, 'translation_word_assignments_catalog_server_modified_at'),
                        questionsCatalog: _.get(item, 'checking_questions_catalog_url'),
                        questionsDateModified: _.get(item, 'checking_questions_catalog_local_modified_at'),
                        questionsServerDateModified: _.get(item, 'checking_questions_catalog_server_modified_at')
                    }));
                }
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

            let dbFields = [
                'slug',
                'reference',
                'title'
            ];
            let items = db.select('chapter', dbFields, '`resource_id`=?', [itemId]);
            let chapters = [];
            if (items !== null) {
                for (let item of items) {
                    chapters.push(Chapter.newInstance({
                        slug: _.get(item, 'slug'),
                        title: _.get(item, 'title'),
                        reference: _.get(item, 'reference')
                    }));
                }
            }
            return chapters;
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

            let items = db.selectRaw(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug]);
            let frames = [];
            if (items !== null) {
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
            }
            return frames;
        };

        /**
         * Returns an array of target languages
         * @returns {TargetLanguage[]}
         */
        _this.getTargetLanguages = function() {
            let fields = ['slug', 'name', 'direction', 'region'];
            let items = db.select('target_language', fields);
            let targetLanguages = [];
            if (items !== null) {
                for (let item of items) {
                    targetLanguages.push(TargetLanguage.newInstance({
                        code: _.get(item, 'slug'),
                        name: _.get(item, 'name'),
                        direction: _.get(item, 'direction'),
                        region: _.get(item, 'region')
                    }));
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

            let results = db.selectRaw(query, [sourceLanguageSlug, projectSlug]);
            if(results === null || results.length === 0) {
                return null;
            }
            let item = results[0];
            let project = Project.newInstance({
                slug: projectSlug,
                sort: item[0],
                dateModified: item[1],
                sourceLanguageCatalog: item[2],
                sourceLanguageSlug: item[3],
                name: item[4],
                description: item[5],
                sourceLanguageCatalogLocalModifiedAt: item[6],
                sourceLanguageCatalogServerModifiedAt: item[7]
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
            let dbFields = [
                'slug',
                'name',
                'project_name',
                'project_description',
                'direction',
                'modified_at',
                'resource_catalog_url',
                'resource_catalog_local_modified_at',
                'resource_catalog_server_modified_at'
            ];
            let item = db.selectOne('source_language', dbFields, '`id`=?', [itemId]);
            let sourceLanguage = SourceLanguage.newInstance({
                code: _.get(item, 'slug'),
                name: _.get(item, 'name'),
                projectName: _.get(item, 'project_name'),
                projectDescription: _.get(item, 'project_description'),
                dateModified: _.get(item, 'modified_at'),
                resourceCatalogUrl: _.get(item, 'resource_catalog_url'),
                resourceCatalogLocalDateModified: _.get(item, 'resource_catalog_local_modified_at'),
                resourceCatalogServerDateModified: _.get(item, 'resource_catalog_server_modified_at'),
                direction: _.get(item, 'direction')
            });
            return sourceLanguage;
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
            let dbFields = [
                'modified_at',
                'source_language_id',
                'slug',
                'name',
                'checking_level',
                'version',
                'source_catalog_url',
                'source_catalog_local_modified_at',
                'source_catalog_server_modified_at',
                'translation_notes_catalog_url',
                'translation_notes_catalog_local_modified_at',
                'translation_notes_catalog_server_modified_at',
                'translation_words_catalog_url',
                'translation_words_catalog_local_modified_at',
                'translation_words_catalog_server_modified_at',
                'translation_word_assignments_catalog_url',
                'translation_word_assignments_catalog_local_modified_at',
                'translation_word_assignments_catalog_server_modified_at',
                'checking_questions_catalog_url',
                'checking_questions_catalog_local_modified_at',
                'checking_questions_catalog_server_modified_at'
            ];
            let item = db.selectOne('resource', dbFields, '`id`=?', [itemId]);
            let resource = Resource.newInstance({
                dateModified: _.get(item, 'modified_at'),
                projectId: projectId,
                sourceLanguageId: sourceLanguageId,
                slug: _.get(item, 'slug'),
                name: _.get(item, 'name'),
                checkingLevel: _.get(item, 'checking_level'),
                version: _.get(item, 'version'),
                sourceCatalog: _.get(item, 'source_catalog_url'),
                sourceDateModified: _.get(item, 'source_catalog_local_modified_at'),
                sourceServerDateModified: _.get(item, 'source_catalog_server_modified_at'),
                notesCatalog: _.get(item, 'translation_notes_catalog_url'),
                notesDateModified: _.get(item, 'translation_notes_catalog_local_modified_at'),
                notesServerDateModified: _.get(item, 'translation_notes_catalog_server_modified_at'),
                wordsCatalog: _.get(item, 'translation_words_catalog_url'),
                wordsDateModified: _.get(item, 'translation_words_catalog_local_modified_at'),
                wordsServerDateModified: _.get(item, 'translation_words_catalog_server_modified_at'),
                wordAssignmentsCatalog: _.get(item, 'translation_word_assignments_catalog_url'),
                wordAssignmentsDateModified: _.get(item, 'translation_word_assignments_catalog_local_modified_at'),
                wordAssignmentsServerDateModified: _.get(item, 'translation_word_assignments_catalog_server_modified_at'),
                questionsCatalog: _.get(item, 'checking_questions_catalog_url'),
                questionsDateModified: _.get(item, 'checking_questions_catalog_local_modified_at'),
                questionsServerDateModified: _.get(item, 'checking_questions_catalog_server_modified_at')
            });
            return resource;
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
            let dbFields = [
                'slug',
                'reference',
                'title'
            ];
            let item = db.selectOne('chapter', dbFields, '`id`=?', [itemId]);
            let chapter = Chapter.newInstance({
                slug: _.get(item, 'slug'),
                reference: _.get(item, 'reference'),
                title: _.get(item, 'title')
            });
            return chapter;
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
            let item = db.selectRaw(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug]);
            if(item === null || item.length === 0 || item[0] == null) {
                return '';
            }
            return item[0];
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
            let dbFields = [
                'body',
                'image_url',
                'format'
            ];
            let item = db.selectOne('frame', dbFields, '`id`=?', [itemId]);
            let frame = Frame.newInstance({
                slug: frameSlug,
                chapterSlug: chapterSlug,
                body: _.get(item, 'body'),
                imageUrl: _.get(item, 'image_url'),
                translationFormat: _.get(item, 'format')
            });
            frame.setDBId(itemId);
            return frame;
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
            let items = db.selectRaw(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug]);
            let translationNotes = [];
            if(items !== null) {
                for (let item of items) {
                    let note = TranslationNote.newInstance({
                        slug: _.get(item, 'slug'),
                        title: _.get(item, 'title'),
                        body: _.get(item, 'body')
                    });
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
            let items = db.selectRaw(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug]);
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
         * Returns an array of checking questions
         * @param projectSlug
         * @param sourceLanguageSlug
         * @param resourceSlug
         * @param chapterSlug
         * @param frameSlug
         * @returns {CheckingQuestion[]}
         */
        _this.getCheckingQuestions = function (projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug) {
            let query = "SELECT `slug`, `question`, `answer` FROM `checking_question`" +
            " WHERE `id` IN (" +
            "   SELECT `checking_question_id` FROM `frame__checking_question`" +
            "   WHERE `project_slug`=? AND `source_language_slug`=? AND `resource_slug`=? AND `chapter_slug`=? AND `frame_slug`=?" +
            ")";
            let items = db.selectRaw(query, [projectSlug, sourceLanguageSlug, resourceSlug, chapterSlug, frameSlug]);
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

        return _this;
    }

    exports.Indexer = Indexer;
}());
