'use strict';

;(function () {

    let Configurator = require('./configurator').Configurator,
        configurator = new Configurator();


    function Translator (appIndex) {

        function fromIndex(type, sourceTranslation) {
            let args = [].slice.call(arguments, fromIndex.length),
                t = 'get' + type[0].toUpperCase() + type.slice(1),
                s = sourceTranslation,
                params = s ? [s.projectId, s.sourceLanguageId, s.resourceId].concat(args) : [];
            return appIndex[t].apply(appIndex, params);
        }

        function fetch(arr, visit) {
            return arr.reduce(function (o, id) {
                o[k] = visit(k);
                return o;
            }, {});
        }

        function getFrame (sourceTranslation, chapterId, frameId) {
            return {
                getSource: function () {
                    return fromIndex('frame', sourceTranslation, chapterId, frameId);
                }
            };
        }

        function getFrames (sourceTranslation, chapterId) {
            let s = sourceTranslation,
                frames = fromIndex('frames', s, chapterId),
                fetchFrame = getFrame.bind(null, s, chapterId);

            return fetch(frames, fetchFrame);
        }

        function getChapter (sourceTranslation, chapterId) {
            let s = sourceTranslation,
                chapterData = fromIndex('chapter', sourceTranslation, chapterId);

            return {
                get number () {
                    return chapterData.number;
                },
                get reference () {
                    return chapterData.ref;
                },
                get title () {
                    return chapterData.title;
                },
                getFrames: getFrames.bind(null, sourceTranslation, chapterId),
                getFrame: getFrame.bind(null, sourceTranslation, chapterId)
            };
        }

        function getChapters (sourceTranslation) {
            let chapters = fromIndex('chapters', sourceTranslation),
                fetchChapter = getChapter.bind(null, sourceTranslation);

            return fetch(chapters, fetchChapter);
        }

        function getProject (sourceTranslation) {
            let s = sourceTranslation;

            let projectData = appIndex.getProject(s.projectId);
            let sourceLanguageData = appIndex.getSourceLanguage(s.projectId, s.sourceLanguageId);
            let resourceData = appIndex.getResource(s.projectId, s.sourceLanguageId, s.resourceId);

            //verify data
            if (!projectData || !sourceLanguageData|| !resourceData) {
                return null;
            }

            return {
                get projectId () {
                    return projectId;
                },
                get sourceLanguageId () {
                    return sourceLanguageId;
                },
                get resourceId () {
                    return resourceId;
                },
                get title () {
                    return sourceLanguageData.project.name;
                },
                get description () {
                    return sourceLanguageData.project.desc;
                },
                get image () {
                    return '';//TODO: where do we get this???
                },
                get sortKey () {
                    return projectData.sort;
                },
                get chapters () {
                    return getChapters(sourceTranslation);
                },
                getChapter: function (chapterId) {
                    return getChapter(sourceTranslation, chapterId);
                }
            };
        }

        function getProjects () {
            let projects = fromIndex('projects'),
                fetchProject = getProject.bind(null);

            return fetch(projects, fetchProject);
        }

        function saveSourceTranslation (sourceTranslation) {
            let s = sourceTranslation;

            configurator.setValue('lastProjectId', s.projectId);
            configurator.setValue(projectId + 'SourceLanguageId', s.sourceLanguageId);
            configurator.setValue(projectId + 'ResourceId', s.resourceId);
        }

        function fetchSourceTranslation () {
            let projectId = configurator.getValue('lastProjectId'),
                sourceLanguageId = configurator.getValue(projectId + 'SourceLanguageId'),
                resourceId = configurator.getValue(projectId + 'ResourceId');

            return {
                projectId,
                sourceLanguageId,
                resourceId
            };
        }

        let translator = {
            get indexId () {
                return appIndex.getIndexId();
            },

            getProject: function (sourceTranslation) {
                let project = getProject(sourceTranslation);
                saveSourceTranslation(sourceTranslation);
                return project;
            },

            getProjects: function () {
                return getProjects();
            },

            getLastProject: function () {
                return this.getProject(fetchSourceTranslation());
            },

            getTargetLanguage: function (projectId) {
                return configurator.getString(projectId + 'TargetLanguageId');
            },

            getLastTargetLanguage: function () {
                return configurator.getValue(configurator.getValue('lastProjectId') + 'TargetLanguageId');
            }
        };

        return translator;
    }

    exports.Translator = Translator;
}());
