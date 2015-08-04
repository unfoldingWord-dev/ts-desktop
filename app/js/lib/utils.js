var path = require('path');

/**
 * pathName() returns an absolutePathname
 * where a resource can be found on a filesystem
 * based pathname (usually derived for the API url)
 * and a baseDir that is the the resource directory
 *
 * @param {String} pathname
 * @param {string} baseDir
 * @return {string} absolutePathname
 */

function setPath (pathname, baseDir) {
    'use strict';

    if (pathname === undefined || pathname === '') {
        return null;
    } else if (pathname.indexOf(path.sep) !== 0) {
        pathname = path.sep + pathname;
    }

    baseDir = baseDir || __dirname;


    return baseDir +  pathname;
}

exports.setPath = setPath;
