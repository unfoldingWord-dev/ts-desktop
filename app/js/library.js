
'use strict';

;(function () {

    let Project = require('../js/core/project');
    let Indexer = require('../js/indexer').Indexer;
    let path = require('path');

    function Library (indexPath, rootApiUrl) {
        rootApiUrl = rootApiUrl; // fix lit errors temporarily
        let indexer = new Indexer(indexPath);

        // TODO: the library should contain the downloader

        function getFrame (sourceTranslation, chapterId, frameId) {

            //build return object
            let returnObj = {
                getSource: function () {
                    return indexer.getFrame(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId, chapterId, frameId);
                }
            };

            //return object
            return returnObj;
        }

        function getFrames (sourceTranslation, chapterId) {

            //get data
            let frames = indexer.getFrames(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId, chapterId);

            //build return object
            let returnObj = {};
            for (let frameId of frames) {
                returnObj[frameId] = getFrame(sourceTranslation, chapterId, frameId);
            }

            //return object
            return returnObj;
        }

        function getChapter (sourceTranslation, chapterId) {

            //get data
            let chapterData = indexer.getChapter(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId, chapterId);

            //build return object
            let returnObj = {
                getNumber: function () {
                    return chapterData.slug;
                },
                getReference: function () {
                    return chapterData.reference;
                },
                getTitle: function () {
                    return chapterData.title;
                },
                getFrames: function () {
                    return getFrames(sourceTranslation, chapterId);
                },
                getFrame: function (frameId) {
                    return getFrame(sourceTranslation, chapterId, frameId);
                }
            };

            //return object
            return returnObj;
        }

        function getChapters (sourceTranslation) {

            //get data
            let chapters = indexer.getChapters(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId);

            //build return object
            let returnObj = {};
            for (let chapterId of chapters) {
                returnObj[chapterId] = getChapter(sourceTranslation, chapterId);
            }

            //return object
            return returnObj;
        }

        function getProjects () {

            //get data
            let projects = indexer.getProjects();

            //build return object
            let returnObj = projects || {};

            //return object
            return returnObj;
        }

        let library = {

            getProjects: function () {
                return getProjects();
            },

            getProject: function (projectSlug, sourceLanguageSlug) {

                //verify parameters
                if (projectSlug === null || sourceLanguageSlug === null) {
                    return null;
                }

                //get data
                let projectData = indexer.getProject(projectSlug);
                let sourceLanguageData = indexer.getSourceLanguage(projectSlug, sourceLanguageSlug);

                //verify data
                if (projectData === null || sourceLanguageData === null) {
                    return null;
                }

                let project = Project.newInstance({
                    slug:projectSlug,
                    sourceLanguageSlug:sourceLanguageSlug,
                    name: sourceLanguageData.projectName,
                    description: sourceLanguageData.projectDescription,
                    sort: projectData.sort,
                    dateModified: projectData.dateModified,
                    sourceLanguageCatalog: projectData.sourceLanguageCatalog,
                    sourceLanguageCatalogLocalDateModified: projectData.sourceLanguageCatalogLocalModifiedAt,
                    sourceLangaugeCatalogServerDateModified: projectData.sourceLanguageCatalogServerModifiedAt
                });

                return project;
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

            //getLastProject: function () {
            //
            //    //get last used values
            //    let projectId = configurator.getValue('lastProjectId');
            //    let sourceLanguageId = configurator.getValue(projectId + 'SourceLanguageId');
            //    let resourceId = configurator.getValue(projectId + 'ResourceId');
            //
            //    //return object
            //    return this.getProject(projectId, sourceLanguageId, resourceId);
            //},
            //
            //getTargetLanguages: function () {
            //
            //},
            //
            //getTargetLanguage: function () {
            //
            //}

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
                if(sourceLanguage === null || (sourceLanguage.code !== sourceLanguageSlug && sourceLanguageSlug !== 'en')) {
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
            }
        };

        return library;

    }

    exports.Library = Library;
}());
