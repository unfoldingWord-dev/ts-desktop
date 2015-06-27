var _ = require('lodash');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var pathObj = require('path');
var fs = require('fs');
var resources = null;

function setResources (inResource) {
    'use strict';
    resources = inResource;
}

function getResourcePath (path) {
    'use strict';

    try {
        return setPath(_.get(resources.tsIndex, path), resources.rootDir + pathObj.sep + 'tsFiles');
    } catch (e) {
        return null;
    }

}

function readResourceFileContent (path) {
    'use strict';
    var data = fs.readFileSync(path, 'utf8') ;
    return JSON.parse (data);
}

function readProject (project) {
    'use strict';
    var path = project + '.lang_catalog';
    return readResourceFileContent (getResourcePath (path, resources.tsIndex, resources.rootDir));

}

function read () {
    'use strict';
    var path;
    var index = resources.tsIndex;
    var rootDir = resources.rootDir;
    var workingArgs = [];
    var content, chapter, frame;
    var pos = 0;
    var resPath = null;


    while (pos < arguments.length) {
        workingArgs[pos] = arguments[pos];
        pos++;
    }

    path = workingArgs.toString().replace(/,/g, '.');
    if (arguments.length > 5) {
        return null;
    }
    if (arguments.length === 1) {
        path = path + '.lang_catalog';
    }
    if (arguments.length === 2) {
        path = path + '.res_catalog';
    }
    if (arguments.length === 3) {
        path = path + '.source';
    }
    if (arguments.length >= 5) {
        frame = workingArgs.pop();
    }
    if (arguments.length >= 4) {
        chapter = workingArgs.pop();
        path = workingArgs.toString().replace(/,/g, '.') + '.source';
    }

    resPath = getResourcePath (path, index, rootDir);
    if (resPath) {
        content = readResourceFileContent(getResourcePath(path, index, rootDir));
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


exports.getResourcePath = getResourcePath;
exports.readProject = readProject;
exports.read = read;
exports.readResourceFileContent = readResourceFileContent;
exports.setResources = setResources;
