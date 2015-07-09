var _ = require('lodash');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var pathObj = require('path');
var fs = require('fs');
var conf = require('./configurator');
var rootDir;
var tsIndex;

var translator = {
    setResources: function (inRootDir, inIndex) {
        'use strict';
        tsIndex = inIndex;
        rootDir = inRootDir;
    },

    getResourcePath: function (path) {
        'use strict';

        try {
            return setPath(_.get(tsIndex, path).replace(/\//gm, pathObj.sep),
                rootDir);

        } catch (e) {
            return null;
        }

    },

    readResourceFileContent: function (path) {
        'use strict';
        if (fs.existsSync(path)) {
            var data = fs.readFileSync(path, 'utf8');
            if (data) {
                return JSON.parse(data);
            }
        }
        return null;
    },

    readProject: function (project) {
        'use strict';
        var path = project + '.lang_catalog';
        return this.readResourceFileContent(this.getResourcePath(path,
            tsIndex, rootDir));

    },

    getProject: function (projectId, languageId, resourceId) {
        'use strict';
        var path = projectId+'.'+languageId+'.'+resourceId+'.source';
        var index = resources.tsIndex;
        var rootDir = resources.rootDir;
        var resPath = this.getResourcePath(path, index, rootDir);
        if (resPath) {
            conf.setValue('last_project_id', projectId);
            conf.setValue(projectId+'_source_language_id', languageId);
            conf.setValue(projectId+'_resource_id', resourceId);
            return this.readResourceFileContent(resPath);
        }
        return null;
    },

    getTargetLanguage: function (projectId) {
        'use strict';
        if (arguments.length < 1 || projectId == null) return null;
        return conf.getString(projectId+'_target_language_id');

    },

    getLastProject: function () {
        'use strict';
        var projectId = conf.getString('last_project_id');
        var languageId = conf.getString(projectId+'_source_language_id');
        var resourceId = conf.getString(projectId+'_resource_id');
        return this.getProject(projectId, languageId, resourceId);
    },

    getLastTargetLanguage: function () {
        'use strict';
        return conf.getString(conf.getString('last_project_id')+'_target_language_id');

    }
};

exports.setResources = translator.setResources;
exports.getResourcePath = translator.getResourcePath;
exports.readResourceFileContent = translator.readResourceFileContent;
exports.readProject = translator.readProject;
exports.getProject = translator.getProject;
exports.getTargetLanguage = translator.getTargetLanguage;
exports.getLastProject = translator.getLastProject;
exports.getLastTargetLanguage = translator.getLastTargetLanguage;