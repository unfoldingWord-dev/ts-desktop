var fs = require('fs');
var path = require('path');


function setPath(pathname, baseDir) {
    if (!path.isAbsolute(pathname)) {
        pathname = path.sep + pathname;
    }
    baseDir = baseDir || __dirname;
    return  baseDir + path.sep + 'tsFiles' + pathname;
}

exports.setPath = setPath;
