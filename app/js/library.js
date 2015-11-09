'use strict';

;(function () {

    let ProjectCategory = require('../js/core/projectcategory');
    let SourceTranslation = require('../js/core/sourcetranslation');
    let Indexer = require('../js/indexer').Indexer;

    function Library (schemaPath, databasePath, rootApiUrl) {
        if(schemaPath === undefined || databasePath === undefined || rootApiUrl === undefined) {
            throw new Error('Invalid parameters');
        }

        const DEFAULT_RESOURCE_SLUG = 'ulb';
        //const MIN_CHECKING_LEVEL = 3;
        rootApiUrl = rootApiUrl; // fix lit errors temporarily
        let indexer = new Indexer(schemaPath, databasePath);

        // TODO: the library should contain the downloader

        let library = {
            indexer: indexer,

            /**
             * Returns an array of projects
             * @param sourceLanguageSlug
             * @returns {Project[]}
             */
            getProjects: function (sourceLanguageSlug) {
                return indexer.getProjects(sourceLanguageSlug);
            },

            /**
             * Returns a project
             * @param projectSlug
             * @param sourceLanguageSlug
             * @returns {Project}
             */
            getProject: function (projectSlug, sourceLanguageSlug) {
                return  indexer.getProject(projectSlug, sourceLanguageSlug);
            },

            /**
             * Returns an array of project categories at the root of the list
             * @param sourceLanguageSlug
             * @return {ProjectCategory[]}
             */
            getProjectCategories: function(sourceLanguageSlug) {
                return this.getProjectCategoryChildren(ProjectCategory.newInstance({
                    title:'',
                    categorySlug: '',
                    projectId: null,
                    sourceLanguageSlug:sourceLanguageSlug,
                    parentCategoryId:0
                }));
            },

            /**
             * Returns an array of project categories that are children of the given category
             * @param parentCategory {ProjectCategory}
             * @return {ProjectCategory[]}
             */
            getProjectCategoryChildren: function(parentCategory) {
                return indexer.getCategoryBranch(parentCategory.getSourceLanguageSlug(), parentCategory.getParentCategoryId());
            },

            /**
             * Deletes the index and rebuilds it from scratch.
             * This will result in a completely empty index
             */
            delete: function () {
                indexer.destroy();
                indexer.rebuild();
            },

            /**
             * Imports the default index into the library
             * @param seedIndexPath the default index
             */
            //deploy: function(seedIndexPath) {
            //    indexer.destroy();
            //
            //    // todo copy seed index into the correct location
            //    // todo connect to db
            //},

            /**
             * Checks if the index exists
             * @returns {boolean}
             */
            exists: function() {
                return indexer.getProjectSlugs().length > 0;
            },

            /**
             * Returns a single target language
             * @param targetLanguageSlug
             * @returns {TargetLanguage}
             */
            getTargetLanguage: function(targetLanguageSlug) {
                return indexer.getTargetLanguage(targetLanguageSlug);
            },

            /**
             * Returns an array of target languages
             * @returns {TargetLanguage[]}
             */
            getTargetLanguages: function() {
                return indexer.getTargetLanguages();
            },

            /**
             * Returns an array of source langauges for the project
             * @param projectSlug
             * @return {SourceLanguage[]}
             */
            getSourceLanguages: function(projectSlug) {
                return indexer.getSourceLanguages(projectSlug);
            },

            /**
             * Returns a single source language in a project
             * @param projectSlug
             * @param sourceLanguageSlug
             */
            getSourceLanguage: function(projectSlug, sourceLanguageSlug) {
                return indexer.getSourceLanguage(projectSlug, sourceLanguageSlug);
            },

            /**
             * Returns a single source language for a project if it exists otherwise the default will be returned
             * The default language is english, or the first available language.
             * If no language is found it will return null
             * @param projectSlug
             * @param
             * @return {SourceLanguage}
             */
            getPreferredSourceLanguage: function(projectSlug, sourceLanguageSlug) {
                // preferred
                let sourceLanguage = indexer.getSourceLanguage(projectSlug, sourceLanguageSlug);
                // default (en)
                if(sourceLanguage === null || sourceLanguage.code !== sourceLanguageSlug && sourceLanguageSlug !== 'en') {
                    sourceLanguage = indexer.getSourceLanguage(projectSlug, 'en');
                }
                return sourceLanguage;
            },

            /**
             * Returns the resources in a source language
             * @param projectSlug
             * @param sourceLanguageSlug
             * @return {Resource[]}
             */
            getResources: function(projectSlug, sourceLanguageSlug) {
                return indexer.getResources(projectSlug, sourceLanguageSlug);
            },

            /**
             * Returns a single resource
             * @param sourceTranslation {SourceTranslation}
             * @returns {Resource}
             */
            getResource: function(sourceTranslation) {
                return indexer.getResource(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug());
            },

            /**
             * Returns an array of chapters
             * @param sourceTranslation
             * @returns {Chapter[]}
             */
            getChapters: function(sourceTranslation) {
                return indexer.getChapters(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug());
            },

            /**
             * Returns a single chapter
             * @param sourceTranslation
             * @param chapterSlug
             * @returns {Chapter}
             */
            getChapter: function(sourceTranslation, chapterSlug) {
                return indexer.getChapter(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug(), chapterSlug);
            },

            /**
             * Returns a checking question
             * @param sourceTranslation
             * @param chapterSlug
             * @param frameSlug
             * @param questionSlug
             * @returns {CheckingQuestion}
             */
            getCheckingQuestion: function(sourceTranslation, chapterSlug, frameSlug, questionSlug) {
                return indexer.getCheckingQuestion(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug(), chapterSlug, frameSlug, questionSlug);
            },

            /**
             * Returns the checking questions in a frame
             * @param sourceTranslation
             * @param chapterSlug
             * @param frameSlug
             * @returns {CheckingQuestion[]}
             */
            getCheckingQuestions: function(sourceTranslation, chapterSlug, frameSlug) {
                return indexer.getCheckingQuestions(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug(), chapterSlug, frameSlug);
            },

            /**
             * Returns the source translation with the default resource.
             * If the default resource does not exist it will use the first available resource
             * @param projectSlug
             * @param sourceLanguageSlug
             * @return {SourceTranslation}
             */
            getDefaultSourceTranslation: function(projectSlug, sourceLanguageSlug) {
                let sourceTranslation = indexer.getSourceTranslation(projectSlug, sourceLanguageSlug, DEFAULT_RESOURCE_SLUG);
                if(sourceTranslation === null) {
                    let resourceSlugs = indexer.getResourceSlugs(projectSlug, sourceLanguageSlug);
                    if(resourceSlugs.length > 0) {
                        return indexer.getSourceTranslation(projectSlug, sourceLanguageSlug, resourceSlugs[0]);
                    }
                } else {
                    return sourceTranslation;
                }
                return null;
            },

            /**
             * Returns an array of frames
             * @param sourceTranslation
             * @param chapterSlug
             * @returns {Frame[]}
             */
            getFrames: function(sourceTranslation, chapterSlug) {
                return indexer.getFrames(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug(), chapterSlug);
            },

            /**
             * Returns a single frame
             * @param sourceTranslation
             * @param chapterSlug
             * @param frameSlug
             * @returns {Frame}
             */
            getFrame: function(sourceTranslation, chapterSlug, frameSlug) {
                return indexer.getFrame(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug(), chapterSlug, frameSlug);
            },

            /**
             * Returns an array of frame slugs
             * @param sourceTranslation
             * @param chapterSlug
             * @returns {string}
             */
            getFrameSlugs: function(sourceTranslation, chapterSlug) {
                let slugs = indexer.getFrameSlugs(sourceTranslation, chapterSlug);
                if(slugs.length > 0) {
                    // TRICKY: a bug in the v2 api gives the last frame in the last chapter and id of 00 which messes up the sorting
                    let firstSlug = slugs[0];
                    if(parseInt(firstSlug) === 0) {
                        slugs.shift();
                        slugs.push(firstSlug);
                    }
                    return slugs;
                } else {
                    return [];
                }
            },

            /**
             * Returns the body of a chapter
             * @param sourceTranslation
             * @param chapterSlug
             * @returns {string}
             */
            getChapterBody: function(sourceTranslation, chapterSlug) {
                return indexer.getChapterBody(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug(), chapterSlug);
            },

            /**
             * Returns the translation format of the chapter body
             * @param sourceTranslation
             * @param chapterSlug
             * @returns {string}
             */
            getChapterBodyFormat: function(sourceTranslation, chapterSlug) {
                return indexer.getChapterBodyFormat(sourceTranslation.getProjectSlug(), sourceTranslation.getSourceLanguageSlug(), sourceTranslation.getResourceSlug(), chapterSlug);
            },

            /**
             * Returns the source translation by it's id
             * @param sourceTranslationSlug
             * @returns {SourceTranslation}
             */
            getSourceTranslationById: function (sourceTranslationSlug) {
                if(sourceTranslationSlug !== null && sourceTranslationSlug !== undefined) {
                    let projectSlug = SourceTranslation.getProjectSlugFromSlug(sourceTranslationSlug);
                    let sourceLanguageSlug = SourceTranslation.getSourceLanguageSlugFromSlug(sourceTranslationSlug);
                    let resourceSlug = SourceTranslation.getResourceSlugFromSlug(sourceTranslationSlug);
                    return this.getSourceTranslation(projectSlug, sourceLanguageSlug, resourceSlug);
                }
                return null;
            },

            /**
             * Returns the source translation
             * @param projectSlug
             * @param sourceLanguageSlug
             * @param resourceSlug
             * @returns {SourceTranslation}
             */
            getSourceTranslation: function (projectSlug, sourceLanguageSlug, resourceSlug) {
                return indexer.getSourceTranslation(projectSlug, sourceLanguageSlug, resourceSlug);
            },

            /**
             * Returns an array of source translations in a project that have met the minimum checking level
             * @param projectSlug
             */
            getSourceTranslations: function(projectSlug) {
                projectSlug = projectSlug;
                // todo: write query for this
                return [];
            }
        };

        return library;

    }

    exports.Library = Library;
}());
