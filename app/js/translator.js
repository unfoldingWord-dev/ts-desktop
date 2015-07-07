var _ = require('lodash');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var pathObj = require('path');
var fs = require('fs');
var rootDir;
var tsIndex;

var navigator = {
    setResources: function (inRootDir, inIndex) {
        'use strict';
        tsIndex = inIndex;
        rootDir = inRootDir;
    },

    getResourcePath: function (path) {
        'use strict';

        try {
            return setPath(_.get(tsIndex, path),
                rootDir );
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

    open: function (project, language, source, chapter, frame) {
        'use strict';
        var path;
        var index = tsIndex;
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
            content = this.readResourceFileContent(resPath);
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


exports.getResourcePath = navigator.getResourcePath;
exports.readProject = navigator.readProject;
exports.open = navigator.open;
exports.readResourceFileContent = navigator.readResourceFileContent;
exports.setResources = navigator.setResources;
