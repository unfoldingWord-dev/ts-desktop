/**
 * Created by delmarhager on 7/1/15.
 */
var traverse = require('traverse');
var fs = require('fs');
var url = require('url');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var _ = require('lodash');

var indexer = {


    indexFiles: function (rootNodeFile, rootDir) {
        'use strict';
        var index = {};

        function setIndex(index, dataObject, resource) {

            var newUrlObj = url.parse(dataObject);
            var pathname = newUrlObj.pathname;
            var propPath = _.dropRight(_.drop(newUrlObj.pathname.split('/'), 1), 1);
            if (propPath[0] === 'ts') {
                propPath = _.drop(propPath, 3);
            }
            propPath.push(resource);
            propPath = propPath.toString().replace(/,/g, '.');
            _.set(index, propPath, pathname);

        }


        function getTsResources(response) {
            var body = response.body;
            var newUrlObj;

            traverse(body).forEach(function (dataObject) {
                var filepath, newResponse;
                if (typeof dataObject === 'string' &&
                    dataObject.indexOf('https') >= 0 &&
                    dataObject.indexOf('date_modified') >= 0 &&
                    dataObject.indexOf('usfm') < 0) {
                    newUrlObj = url.parse(dataObject);
                    filepath = setPath(newUrlObj.pathname, rootDir);
                    if (filepath && fs.existsSync(filepath)) {
                        setIndex(index, dataObject, this.key);
                        var data = fs.readFileSync(filepath, 'utf8');
                        if (data.length > 0) {
                            newResponse = {body: JSON.parse(data)};
                            getTsResources(newResponse);
                        }
                    }
                }
            });
        }

        var filepath = setPath(rootNodeFile, rootDir);

        if (fs.existsSync(filepath)) {
            var data = fs.readFileSync(filepath, 'utf8'),
                newResponse;
            if (data.length > 0) {
                newResponse = {body: JSON.parse(data)};
                getTsResources(newResponse);
            }

            return index;
        }


    }
};

exports.indexFiles = indexer.indexFiles;
exports.index = indexer.index;
