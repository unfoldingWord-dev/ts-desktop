var fs = require('fs');
var path = require('path');


function setPath(pathname, baseDir) {
    if (pathname === undefined) {
        pathname =  path.sep + dummy.txt;
    } else  if (pathname.indexOf(path.sep) != 0){
       pathname = path.sep + pathname;
    }

    baseDir = baseDir || __dirname;


    return  baseDir +  pathname;
}

exports.setPath = setPath;
