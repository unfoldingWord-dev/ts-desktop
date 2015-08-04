/**
 * Created by delmarhager on 5/25/15.
 */

var assert = require('assert');
var translator = require('../../app/js/translator');
//var index = require('./data/resources');
var path = require('path');
var resources = require('../../app/js/downloader');
var dataDir = __dirname + path.sep + 'data';
var tsDir = dataDir + path.sep + 'tsFiles';
//var bookSource = require('./data/1ch.en.ulb.source.json');
//var languageResource = require('./data/languageResource.json');
//var projectResource = require('./data/projectResource.json');
//var firstCo = require('./data/1co.json');
//var firstCo13 = firstCo.chapters[12];
//var firstCo13Frame = firstCo.chapters[12].frames[2];
var pr = new resources.Resources('https://api.unfoldingword.org/ts/txt/2/catalog.json',
    dataDir);
var indexer = require('../../app/js/indexer');

;(function () {
    'use strict';

    describe('@Indexer', function () {
        beforeEach(function (done) {
            translator.setResources(pr);
            done();
        });

        describe('@Indexer', function () {
            beforeEach(function (done) {
                done();
            });

            describe('@EmptyIndex ', function () {
                it('should get empty index', function () {
                    var index = {};
                    indexer.indexFiles('', dataDir);
                    assert.equal(JSON.stringify(index).replace(/ /g, ''),
                        JSON.stringify({}).replace(/ /g, ''));
                });
            });

            describe('@FileIndex ', function () {
                it('should get  index', function () {
                    var index = indexer.indexFiles('catalog.json',  tsDir);
                    assert.equal(JSON.stringify(index).replace(/ /g, '').length,
                        1480);
                });
            });
        });
    });

})();
