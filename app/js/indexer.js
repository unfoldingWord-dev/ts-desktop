var _ = require('lodash');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var fs = require('fs');
var resources = null;

//options are used for testing. They are not normally set

var options = null;

function setResources (inResource) {
    resources = inResource;
}

function getResourcePath (path) {
    return setPath (_.get(resources.tsIndex, path), resources.rootDir);
}

function readResourceFileContent (path) {
    var data = fs.readFileSync(path, 'utf8') ;
    return JSON.parse (data);
}

function readProject (project) {

    var path = project + '.lang_catalog';
    return readResourceFileContent (getResourcePath (path, resources.tsIndex, resources.rootDir));

}

function read () {
    var path;
    var index = resources.tsIndex;
    var rootDir = resources.rootDir;
    var workingArgs = [];
    var content, chapter, frame;
    pos = 0;

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
exports.readResourceFileContent = readResourceFileContent;
exports.setResources = setResources;
