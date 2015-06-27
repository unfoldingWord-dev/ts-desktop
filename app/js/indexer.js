var _ = require('lodash');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var fs = require('fs');
var resources = require('./loadResources');

//options are used for testing. They are not normally set

var options = null;

function setOptions (newOptions) {
    options = _.clone(newOptions);
}
function getResourcePath (path, index, rootDir) {
    index = index || resources.tsIndex;
    return setPath (_.get(index, path), rootDir);
}

function readResourceFileContent (path) {
    var data = fs.readFileSync(path, 'utf8') ;
    return JSON.parse (data);
}

function readProject (project) {
    var index = null;
    var rootDir = null;
    if (options) {
        index = options.index || resources.tsIndex;
        rootDir = options.rootDir;
    }
    var path = project + '.lang_catalog';
    return readResourceFileContent (getResourcePath (path, index, rootDir));

}

function read () {
    var path;
    var index = null;
    var rootDir = null;
    var workingArgs = [];
    var content, chapter, frame;
    pos = 0;

    if (options) {
        index = options.index || resources.tsIndex;
        rootDir = options.rootDir;
    }

    while (pos < arguments.length) {
        workingArgs[pos] = arguments[pos];
        pos++;
    }

    path = workingArgs.toString().replace(/,/g, '.');
    if (arguments.length == 1) {
        path = path + '.lang_catalog'
    }
    if (arguments.length == 2) {
        path = path + '.res_catalog'
    }
    if (arguments.length == 3) {
        path = path + '.source'
    }
    if (arguments.length >= 5) {
        frame = workingArgs.pop();
    }
    if (arguments.length >= 4) {
        chapter = workingArgs.pop();
        path = workingArgs.toString().replace(/,/g, '.') + '.source';
    }
    content = readResourceFileContent (getResourcePath (path, index, rootDir));
    if (arguments.length < 4) {
        return content;
    }

    if (arguments.length == 4) {
         return content.chapters[chapter - 1];
    }

    if (arguments.length == 5) {
        return content.chapters[chapter - 1].frames[frame - 1];
    }


}


exports.getResourcePath = getResourcePath;
exports.readProject = readProject;
exports.read = read;
exports.setOptions = setOptions;
exports.readResourceFileContent = readResourceFileContent;
