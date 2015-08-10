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
    }
    baseDir = baseDir || __dirname;
    return baseDir.replace(/[\\\/ ]*$/, path.sep).replace(/\//gm, path.sep) + pathname.replace(/\//gm, path.sep).replace(/^[\\\/ ]*/, '');
}

function getUrlFromObj (itemObj, urlProp) {
    'use strict';
    //NOTE: if a third argument is present and set to true, the query string will be removed before returning the URL
    if (arguments.length > 2 && arguments[2] === true) {
        return itemObj[urlProp].split('?')[0];
    }
    return itemObj[urlProp];
}

exports.setPath = setPath;
exports.getUrlFromObj = getUrlFromObj;
