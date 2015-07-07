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

function Resources(initResUrl, dataDir) {

    var self = this;

    self.downloadCounter = 0;
    self.finishedCB = null;

    this.index = null;

    /*jshint validthis:true */
    'use strict';
    self.rootResourceUrl = initResUrl;
    self.rootDir = dataDir;

    self.setOptions = function (newOptions) {
        options = _.clone(newOptions);
        self.rootDir = rootDir;
    };

    function fsCB(err) {
        if (err) {
            //todo: error handler
        }
    }

    function getTSFiles(urlPath, successCB) {
        successCB(urlPath, true);
    }

    function mkdir(pathname, successCB) {

        mkdirp(setPath(pathname, self.rootDir), function (err) {
            if (err) {

            } else {
                if (successCB) {
                    successCB();
                }
            }
        });
    }


    function getTsResource(urlString, fileUpdate, topLevel) {

        var update = fileUpdate || true;

        var urlObj = url.parse(urlString);
        var response;
        if (urlObj.host) {
            request.get(urlString, {json: true}, function (err, res, body) {
                if (!err && res.statusCode === 200) {
                    response = {body: body, urlString: urlString};
                    getTsResources(response, update, topLevel);
                } else if (!err) {
                    //todo: handle non statusCode equal 200
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
        var filePath = setPath(urlObj.pathname, self.rootDir);
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

    function notFiltered(key, dataObject) {
        if (filter.length == 0) {
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

    function getTsResources(response, update, topLevel) {

        var urlString = response.urlString;
        var body = response.body;
        var urlObj = url.parse(urlString);
        var newUrlObj;
        var filePath;
        var filesTraversed = 0;
        mkdir(path.dirname(urlObj.pathname), function () {

            if (update) {
                fs.writeFileSync(setPath(urlObj.pathname, self.rootDir), JSON.stringify(body));
            }
            if (!topLevel) {


                traverse(body).forEach(function (dataObject) {

                    if (typeof dataObject === 'string' &&
                        dataObject.indexOf('https') >= 0 &&
                        dataObject.indexOf('date_modified') >= 0 &&
                        dataObject.indexOf('usfm') < 0 &&
                        notFiltered(this.key, dataObject)) {
                        filesTraversed += 1;
                        self.downloadCounter += 1;
                        if (dataObject.indexOf('date_modified') >= 0 && canUpdateFile(dataObject)) {
                            getTsResource(dataObject, true);
                        } else {
                            var newResponse;
                            newUrlObj = url.parse(dataObject);
                            filePath = setPath(newUrlObj.pathname, self.rootDir);
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

            console.log('filesTraversed = ' + filesTraversed + ' ; downloadCounter =' + self.downloadCounter)
            if (filesTraversed <= 0 && self.downloadCounter <= 0) {
                if (self.finishedCB) {
                    self.index = null;
                    self.finishedCB(self);
                }
            }
            self.downloadCounter -= 1;
        });

    }


    self.getTsResourcesFromCatalog = function (search, finishedCallBack) {

        self.finishedCB = finishedCallBack;
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

        getTsResource(self.rootResourceUrl, true, topLevel);
    };


    self.downloadProjectList = function (cb) {
        var urlObj = url.parse(self.rootResourceUrl);
        var filePath = setPath(urlObj.pathname, self.rootDir);
        self.downloadProjects(function () {
            if (fs.existsSync(filePath)) {
                var data = fs.readFileSync(filePath, 'utf8');

                if (data.length > 0) {
                   cb ( JSON.parse(data));
                } else {
                    cb(null);
                }
            }
        });
    };

    self.downloadLanguageList = function (proj, successCB) {

        var langList = [];
        self.getTsResourcesFromCatalog(proj, function () {

            self.index = indexer.indexFiles('ts/txt/2/catalog.json', self.rootDir);

            translator.setResources(self.rootDir, self.index)
            var resource = translator.open(proj);
            if (resource) {

                traverse(resource).forEach(function (dataObject) {
                    if (this.key === 'slug') {
                        langList.push(dataObject);
                    }
                });
                successCB(langList);
            }
            else {
                successCB(null);
            }
        });
    };

    self.downloadLanguage = function (proj, lang, callback) {
        if (self.index == null) {
            self.index = indexer.indexFiles('ts/txt/2/catalog.json', self.rootDir);
        }
        translator.setResources(self.rootDir, self.index)
        var resource = translator.open(proj, lang);
        if (resource) {
            return resource;
        }
        else {
            return null;
        }

    };

    self.downloadProject = function (proj, callback) {
        self.getTsResourcesFromCatalog(proj, callback);
    }

    self.downloadProjects = function (callback) {
        self.getTsResourcesFromCatalog('projects', callback);
    }


    return self;
}

exports.Resources = Resources;

