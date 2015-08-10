var assert = require('assert');
var Indexer = require('../../app/js/indexer').Indexer;
var testIndexer = new Indexer('test');

var projectsCatalogJson = require('./data/ts/txt/2/catalog.json');
projectsCatalogJson = JSON.stringify(projectsCatalogJson);
var sourceLanguagesCatalogJson = require('./data/ts/txt/2/1ch/languages.json');
sourceLanguagesCatalogJson = JSON.stringify(sourceLanguagesCatalogJson);

;(function () {
    'use strict';

    describe('@Indexer', function () {

        describe('@IndexProjects ', function () {
            it('should index projects catalog', function () {
                assert.equal(
                    testIndexer.indexProjects(projectsCatalogJson),
                    true
                );
            });
        });

        describe('@IndexSourceLanguages ', function () {
            it('should index 1ch source languages catalog', function () {
                assert.equal(
                    testIndexer.indexSourceLanguages(
                        '1ch',
                        sourceLanguagesCatalogJson,
                        {'date_modified':'20150801'}
                    ),
                    true
                );
            });
        });

    });

})();
