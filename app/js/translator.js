var Configurator = require('./configurator').Configurator;
var configurator = new Configurator();

;(function () {
    'use strict';

    function Translator (appIndex) {

        //reassign this to _this, set indexId and rootPath
        //var _this = this;

        function getFrame (sourceTranslation, chapterId, frameId) {

            //build return object
            var returnObj = {
                getSource: function () {
                    return appIndex.getFrame(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId, chapterId, frameId);
                }
            };

            //return object
            return returnObj;
        }
        function getFrames (sourceTranslation, chapterId) {

            //get data
            var frames = appIndex.getFrames(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId, chapterId);

            //build return object
            var returnObj = {};
            for (let frameId of frames) {
                returnObj[frameId] = getFrame(sourceTranslation, chapterId, frameId);
            }

            //return object
            return returnObj;
        }

        function getChapter (sourceTranslation, chapterId) {

            //get data
            var chapterData = appIndex.getChapter(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId, chapterId);

            //build return object
            var returnObj = {
                getNumber: function () {
                    return chapterData.number;
                },
                getReference: function () {
                    return chapterData.ref;
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
            var chapters = appIndex.getChapters(sourceTranslation.projectId, sourceTranslation.sourceLanguageId, sourceTranslation.resourceId);

            //build return object
            var returnObj = {};
            for (let chapterId of chapters) {
                returnObj[chapterId] = getChapter(sourceTranslation, chapterId);
            }

            //return object
            return returnObj;
        }

        var translator = {
            getIndexId: function () {
                return appIndex.getIndexId();
            },

            getProject: function (projectId, sourceLanguageId, resourceId) {

                //verify vars
                if (projectId === null || sourceLanguageId === null || resourceId === null) {
                    return null;
                }

                //get data
                var projectData = appIndex.getProject(projectId);
                var sourceLanguageData = appIndex.getSourceLanguage(projectId, sourceLanguageId);
                var resourceData = appIndex.getResource(projectId, sourceLanguageId, resourceId);

                //verify data
                if (projectData === null || sourceLanguageData === null || resourceData === null) {
                    return null;
                }

                //build sourceTranslation object
                //TODO: eventually this will be what is passed into this method
                var sourceTranslation = {
                    projectId: projectId,
                    sourceLanguageId: sourceLanguageId,
                    resourceId: resourceId
                };

                //build return object
                var returnObj = {
                    getProjectId: function () {
                        return projectId;
                    },
                    getSourceLanguageId: function () {
                        return sourceLanguageId;
                    },
                    getResourceId: function () {
                        return resourceId;
                    },
                    getTitle: function () {
                        return sourceLanguageData.project.name;
                    },
                    getDescription: function () {
                        return sourceLanguageData.project.desc;
                    },
                    getImage: function () {
                        return '';//TODO: where do we get this???
                    },
                    getSortKey: function () {
                        return projectData.sort;
                    },
                    getChapters: function () {
                        return getChapters(sourceTranslation);
                    },
                    getChapter: function (chapterId) {
                        return getChapter(sourceTranslation, chapterId);
                    },
                    getFrames: function (chapterId) {
                        return getFrames(sourceTranslation, chapterId);
                    },
                    getFrame: function (chapterId, frameId) {
                        return getFrame(sourceTranslation, chapterId, frameId);
                    }
                };

                //save last used values
                configurator.setValue('lastProjectId', projectId);
                configurator.setValue(projectId + 'SourceLanguageId', sourceLanguageId);
                configurator.setValue(projectId + 'ResourceId', resourceId);

                //return object
                return returnObj;
            },

            getLastProject: function () {

                //get last used values
                var projectId = configurator.getValue('lastProjectId');
                var sourceLanguageId = configurator.getValue(projectId + 'SourceLanguageId');
                var resourceId = configurator.getValue(projectId + 'ResourceId');

                //return object
                return this.getProject(projectId, sourceLanguageId, resourceId);
            },

            getTargetLanguage: function (projectId) {

                //verify data
                if (projectId === null) {
                    return null;
                }

                //return string
                return configurator.getString(projectId + 'TargetLanguageId');
            },

            getLastTargetLanguage: function () {

                //return string
                return configurator.getString(configurator.getString('lastProjectId') + 'TargetLanguageId');
            }
        };

        return translator;
    }

    exports.Translator = Translator;
}());
