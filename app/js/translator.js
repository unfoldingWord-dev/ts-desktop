var configurator = require('./configurator');
var Indexer = require('./indexer').Indexer;
var appIndex = new Indexer('app');

function getFrame (projectId, sourceLanguageId, resourceId, chapterId, frameId) {
    'use strict';

    //build return object
    var returnObj = {
        getSource: function () {
            return appIndex.getFrame(projectId, sourceLanguageId, resourceId, chapterId, frameId);
        }
    };

    //return object
    return returnObj;
}
function getFrames (projectId, sourceLanguageId, resourceId, chapterId) {
    'use strict';

    //get data
    var frames = appIndex.getFrames(projectId, sourceLanguageId, resourceId, chapterId);

    //build return object
    var returnObj = {};
    //for (let frameId of frames) {
    for (var frame in frames) {
        if (frames.hasOwnProperty(frame)) {
            var frameId = frames[frame];
            returnObj[frameId] = getFrame(projectId, sourceLanguageId, resourceId, chapterId, frameId);
        }
    }

    //return object
    return returnObj;
}

function getChapter (projectId, sourceLanguageId, resourceId, chapterId) {
    'use strict';

    //build return object
    var returnObj = {
        getFrames: function () {
            return getFrames(projectId, sourceLanguageId, resourceId, chapterId);
        },
        getFrame: function (frameId) {
            return getFrame(projectId, sourceLanguageId, resourceId, chapterId, frameId);
        }
    };

    //return object
    return returnObj;
}
function getChapters (projectId, sourceLanguageId, resourceId) {
    'use strict';

    //get data
    var chapters = appIndex.getChapters(projectId, sourceLanguageId, resourceId);

    //build return object
    var returnObj = {};
    //for (let chapterId of chapters) {
    for (var chapter in chapters) {
        if (chapters.hasOwnProperty(chapter)) {
            var chapterId = chapters[chapter];
            returnObj[chapterId] = getChapter(projectId, sourceLanguageId, resourceId, chapterId);
        }
    }

    //return object
    return returnObj;
}

var translator = {
    useIndex: function (indexId) {
        'use strict';
        appIndex = new Indexer(indexId);
    },

    getIndexId: function () {
        'use strict';
        return appIndex.getIndexId();
    },

    getProject: function (projectId, sourceLanguageId, resourceId) {
        'use strict';

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
                return getChapters(projectId, sourceLanguageId, resourceId);
            },
            getChapter: function (chapterId) {
                return getChapter(projectId, sourceLanguageId, resourceId, chapterId);
            },
            getFrames: function (chapterId) {
                return getFrames(projectId, sourceLanguageId, resourceId, chapterId);
            },
            getFrame: function (chapterId, frameId) {
                return getFrame(projectId, sourceLanguageId, resourceId, chapterId, frameId);
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
        'use strict';

        //get last used values
        var projectId = configurator.getValue('lastProjectId');
        var sourceLanguageId = configurator.getValue(projectId + 'SourceLanguageId');
        var resourceId = configurator.getValue(projectId + 'ResourceId');

        //return object
        return this.getProject(projectId, sourceLanguageId, resourceId);
    },

    getTargetLanguage: function (projectId) {
        'use strict';

        //verify data
        if (projectId === null) {
            return null;
        }

        //return string
        return configurator.getString(projectId + 'TargetLanguageId');
    },

    getLastTargetLanguage: function () {
        'use strict';

        //return string
        return configurator.getString(configurator.getString('lastProjectId') + 'TargetLanguageId');

    }
};

exports.useIndex = translator.useIndex;
exports.getIndexId = translator.getIndexId;
exports.getProject = translator.getProject;
exports.getLastProject = translator.getLastProject;
exports.getTargetLanguage = translator.getTargetLanguage;
exports.getLastTargetLanguage = translator.getLastTargetLanguage;
