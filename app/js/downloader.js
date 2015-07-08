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
var translator = require('./translator');
var indexer = require('./indexer');

var options;

var filter;

function Resources (initResUrl, dataDir) {
    'use strict';
    var _this = this;

    _this.downloadCounter = 0;
    _this.finishedCB = null;

    this.index = null;


    /*jshint validthis:true */
    _this.rootResourceUrl = initResUrl;
    _this.rootDir = dataDir;

    _this.setOptions = function (newOptions) {
        options = _.clone(newOptions);
    };

    function mkdir (pathname, successCB) {

        mkdirp(setPath(pathname, _this.rootDir), function (err) {
            if (err) {
                // TODO: error handler
                // jscs:disable disallowEmptyBlocks
            } else {
                if (successCB) {
                    successCB();
                }
            }
        });
    }


    function getTsResource (urlString, fileUpdate, topLevel) {
        var update = fileUpdate || true;

        var urlObj = url.parse(urlString);
        var response;
        if (urlObj.host) {
            request.get(urlString, {json: true}, function (err, res, body) {
                if (!err && res.statusCode === 200) {
                    response = {body: body, urlString: urlString};
                    getTsResources(response, update, topLevel);
                } else if (!err) {

                    //TODO: handle non statusCode equal 200
                    // jscs:disable disallowEmptyBlocks

                } else {
                    if (err.code === 'ETIMEDOUT') {

                        getTsResource(urlString, update);
                    }
                }
            });
        }

    }

    function canUpdateFile (urlString) {

        var urlObj = url.parse(urlString);
        var filePath = setPath(urlObj.pathname, _this.rootDir);
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

    function notFiltered (key, dataObject) {
        if (filter.length === 0) {
            return true;
        }
        if (key === 'lang_catalog' && filter.length > 0) {
            if (dataObject.indexOf(path.sep + filter[0] + path.sep) >= 0) {
                return true;
            }
        } else if (key === 'res_catalog' && filter.length > 1) {
            if (dataObject.indexOf(path.sep + filter[0] + path.sep + filter[1] + path.sep) >= 0) {
                return true;
            }
        } else if (key === 'source' && filter.length > 2) {
            if (dataObject.indexOf(path.sep + filter[0] + path.sep + filter[1] + path.sep + filter[2] + path.sep) >= 0) {
                return true;
            }
        }

        return false;

    }

    function getTsResources (response, update, topLevel) {
        var urlString = response.urlString;
        var body = response.body;
        var urlObj = url.parse(urlString);
        var newUrlObj;
        var filePath;
        var filesTraversed = 0;
        mkdir(path.dirname(urlObj.pathname),
            function () {
                if (update) {
                    fs.writeFileSync(setPath(urlObj.pathname, _this.rootDir), JSON.stringify(body));
                }

                if (!topLevel) {
                    traverse(body).forEach(function (dataObject) {

                        if (typeof dataObject === 'string' &&
                            dataObject.indexOf('https') >= 0 &&
                            dataObject.indexOf('date_modified') >= 0 &&
                            dataObject.indexOf('usfm') < 0 &&
                            notFiltered(this.key, dataObject)) {
                            filesTraversed += 1;
                            _this.downloadCounter += 1;
                            if (dataObject.indexOf('date_modified') >= 0 && canUpdateFile(dataObject)) {
                                getTsResource(dataObject, true);
                            } else {
                                var newResponse;
                                newUrlObj = url.parse(dataObject);
                                filePath = setPath(newUrlObj.pathname, _this.rootDir);
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
                }

                console.log('filesTraversed = ' + filesTraversed + ' ; downloadCounter =' + _this.downloadCounter);
                if (filesTraversed <= 0 && _this.downloadCounter <= 0) {
                    if (_this.finishedCB) {
                        _this.index = null;
                        _this.finishedCB(_this);
                    }
                }
                _this.downloadCounter -= 1;
            }
        );
    }


    _this.getTsResourcesFromCatalog = function (search, finishedCallBack) {

        _this.finishedCB = finishedCallBack;
        var topLevel = false;

        if (search === 'projects') {
            topLevel = true;
            search = '';
        }

        filter = search || '';
        if (filter === '') {
            filter = [];
        } else {
            filter = filter.split('.');
        }

        _this.getTsResource(_this.rootResourceUrl, true, topLevel);
    };


    _this.downloadProjectList = function (cb) {
        var urlObj = url.parse(_this.rootResourceUrl);
        var filePath = setPath(urlObj.pathname, _this.rootDir);
        _this.downloadProjects(function () {
            if (fs.existsSync(filePath)) {
                var data = fs.readFileSync(filePath, 'utf8');

                if (data.length > 0) {
                    cb(JSON.parse(data));
                } else {
                    cb(null);
                }
            }
        });
    };

    _this.downloadLanguageList = function (proj, successCB) {

        var langList = [];
        _this.getTsResourcesFromCatalog(proj, function () {

            _this.index = indexer.indexFiles('ts/txt/2/catalog.json', _this.rootDir);

            translator.setResources(_this.rootDir, _this.index);
            var resource = translator.open(proj);
            if (resource) {

                traverse(resource).forEach(function (dataObject) {
                    if (this.key === 'slug') {
                        langList.push(dataObject);
                    }
                });
                successCB(langList);
            } else {
                successCB(null);
            }
        });
    };

    _this.downloadLanguage = function (proj, lang, callback) {
        //TODO: This function is not complete. There are some design issues
        if (_this.index === null) {
            _this.index = indexer.indexFiles('ts/txt/2/catalog.json', _this.rootDir);
        }
        translator.setResources(_this.rootDir, _this.index);
        var resource = translator.open(proj, lang);
        if (resource) {
            callback(resource);
        } else {
            callback(null);
        }

    };

    _this.downloadProject = function (proj, callback) {
        _this.getTsResourcesFromCatalog(proj, callback);
    };

    _this.downloadProjects = function (callback) {
        _this.getTsResourcesFromCatalog('projects', callback);
    };


    return _this;
}

exports.Resources = Resources;

