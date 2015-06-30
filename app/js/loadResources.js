var mkdirp = require('mkdirp');
var url = require('url');
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var request = require('request');
var traverse = require('traverse');
var moment = require('moment');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var rootDir;
var tsIndex = {a: 'a'};

var rootResourceUrl = null;
var options;


function resources(initResUrl) {
    /*jshint validthis:true */
    'use strict';
    rootResourceUrl = initResUrl;
    this.setTsIndex = function (newIndex) {
        tsIndex = _.cloneDeep(newIndex);
    };

    this.rootDir = null;
    this.setOptions = function (newOptions) {
        options = _.clone(newOptions);
        tsIndex = newOptions.index || tsIndex;
        this.tsIndex = tsIndex;
        rootDir = options.rootDir;
        this.rootDir = rootDir;
    };

    this.tsIndex = function () {
        return tsIndex;
    };

    function fsCB(err) {
        if (err) {
            //todo: error handler
        }
    }

    function setIndex(dataObject) {

        var newUrlObj = url.parse(dataObject);
        var pathname = setPath(newUrlObj.pathname, rootDir);
        var resource = newUrlObj.pathname.split('/').pop().split('.')[0];
        var propPath = _.dropRight(_.drop(newUrlObj.pathname.split('/'), 1), 1);
        if (propPath[0] === 'ts') {
            propPath = _.drop(propPath, 3);
        }
        propPath.push(resource);
        propPath = propPath.toString().replace(/,/g, '.');
        _.set(tsIndex, propPath, pathname);

    }

    function getTSFiles(url, successCB) {
        successCB(url, true);
    }

    function mkdir(pathname, successCB) {

        mkdirp(setPath(pathname, rootDir), function (err) {
            if (err) {

            } else {
                if (successCB) {
                    successCB();
                }
            }
        });
    }


    function getTsResource(urlString, update) {

        var urlObj = url.parse(urlString);
        var response;
        if (urlObj.host) {
            request.get(urlString, {json: true}, function (err, res, body) {
                if (!err && res.statusCode === 200) {
                    response = {body: body, urlString: urlString};
                    getTsResources(response, update);
                } else if (!err) {
                    //todo: error handler
                } else {

                    if (err.code === 'ETIMEDOUT') {

                        getTsResource(urlString, update);
                    }
                }
            });
        }

    }

    function canUpdateFile(urlString) {

        var urlObj = url.parse(urlString);
        var filePath = setPath(urlObj.pathname, rootDir);
        var dateString = urlObj.query.slice(-8, -4) + '-' + urlObj.query.slice(-4, -2) + '-' + urlObj.query.slice(-2);
        if (fs.existsSync(filePath)) {
            var fileStat = fs.statSync(filePath);
            if (fileStat.size === 0) {
                return true;
            }
            if (fileStat.isFile()) {
                if (moment(fileStat.birthtime).isBefore(dateString)) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return true;
    }

    function getTsResources(response, update) {

        var urlString = response.urlString;
        var body = response.body;
        var urlObj = url.parse(urlString);
        var newUrlObj;
        var filePath;
        mkdir(path.dirname(urlObj.pathname), function () {
            if (update) {
                fs.writeFile(setPath(urlObj.pathname, rootDir), JSON.stringify(body), fsCB);
            }
            traverse(body).forEach(function (dataObject) {

                if (typeof dataObject === 'string' && dataObject.indexOf('https') >= 0 && dataObject.indexOf('date_modified') >= 0 && dataObject.indexOf('usfm') < 0) {
                    setIndex(dataObject);
                    if (dataObject.indexOf('date_modified') >= 0 && canUpdateFile(dataObject)) {
                        getTsResource(dataObject, true);
                    } else {
                        var newResponse;
                        newUrlObj = url.parse(dataObject);
                        filePath = setPath(newUrlObj.pathname, rootDir);
                        if (fs.existsSync(filePath)) {
                            fs.readFile(filePath, 'utf8', function (err, data) {
                                 if (!err) {
                                    if (data.length > 0) {
                                        newResponse = {body: JSON.parse(data), urlString: dataObject};
                                        getTsResources(newResponse, false);
                                    }
                                }
                            });
                        } else {
                            getTsResource(dataObject, false);
                        }
                    }
                }
            });
        });
    }

    this.getTsResourcesFromCatalog = function () {

        rootDir = __dirname + path.sep + 'tsFiles';
        getTSFiles(rootResourceUrl, getTsResource);
    };

    this.refreshIndex = function () {
        var rootDir = __dirname + path.sep + 'tsFiles';
        tsIndex = {};
        var newResponse;
        var newUrlObj = url.parse(rootResourceUrl);
        var filePath = setPath(newUrlObj.pathname, rootDir);

        if (fs.existsSync(filePath)) {
            fs.readFile(filePath, 'utf8', function (err, data) {
                if (!err) {
                    if (data.length > 0) {
                        newResponse = {body: JSON.parse(data), urlString: newUrlObj};
                        getTsResources(newResponse, false);
                    }
                }
            });
        }
    };
}

exports.resources = resources;

