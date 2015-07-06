var _ = require('lodash');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var pathObj = require('path');
var fs = require('fs');
var resources = null;

var translator = {
    setResources: function(inResource) {
        'use strict';
        resources = inResource;
    },

    getResourcePath: function(path) {
        'use strict';

        try {
            return setPath(_.get(resources.tsIndex, path).replace(/\//gm, pathObj.sep),
                resources.rootDir + pathObj.sep + 'tsFiles');
        } catch (e) {
            return null;
        }

    },

    readResourceFileContent: function(path) {
        'use strict';
        var data = fs.readFileSync(path, 'utf8');
        return JSON.parse(data);
    },

    readProject: function(project) {
        'use strict';
        var path = project + '.lang_catalog';
        return this.readResourceFileContent(this.getResourcePath(path,
            resources.tsIndex, resources.rootDir));

    },

    open: function(project, language, source, chapter, frame) {
        'use strict';
        var path;
        var index = resources.tsIndex;
        var rootDir = resources.rootDir;
        var workingArgs = [];
        var content;
        var pos = 0;
        var resPath;

        //arguments are not a true array. So making a shadow arguments array
        while (pos < arguments.length) {
            workingArgs[pos] = arguments[pos];
            pos++;
        }

        path = workingArgs.toString().replace(/,/g, '.');

        if (arguments.length > 5) {
            return null;
        }
        if (arguments.length === 1) {
            //project resource
            path = path + '.lang_catalog';
        }
        if (arguments.length === 2) {
            //language resource
            path = path + '.res_catalog';
        }
        if (arguments.length === 3) {
            //source file
            path = path + '.source';
        }
        if (arguments.length >= 5) {
            //frame numbers in chapter
            frame = workingArgs.pop();
        }
        if (arguments.length >= 4) {
            //chapter
            chapter = workingArgs.pop();
            path = workingArgs.toString().replace(/,/g, '.') + '.source';
        }

        resPath = this.getResourcePath(path, index, rootDir);
        if (resPath) {
            content = this.readResourceFileContent(this.getResourcePath(path, index, rootDir));
            if (arguments.length < 4) {
                return content;
            }

            if (arguments.length === 4) {
                return content.chapters[chapter - 1];
            }

            if (arguments.length === 5) {
                return content.chapters[chapter - 1].frames[frame - 1];
            }
        }
        return null;
    }
};


exports.getResourcePath = translator.getResourcePath;
exports.readProject = translator.readProject;
exports.open = translator.open;
exports.readResourceFileContent = translator.readResourceFileContent;
exports.setResources = translator.setResources;
