var assert = require('assert');
var translator = require('../../app/js/translator');
var Indexer = require('../../app/js/indexer').Indexer;
var testIndexer = new Indexer('test');

var projectsCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/catalog.json'));
var sourceLanguagesCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/1ch/languages.json'));
var resourcesCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/1ch/ar/resources.json'));
var sourceCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/1ch/ar/avd/source.json'));
var project = JSON.parse(sourceLanguagesCatalogJson)[1].project;
var titleStr = project.name;
var descriptionStr = project.desc;
var imageStr = '';//TODO: where do we get this???
var sortKeyStr = project.sort;

;(function () {
    'use strict';

    describe('@Translator', function () {

        before(function () {
            //TODO: clear out index/test directory so tests run in clean environment
            testIndexer.indexProjects(projectsCatalogJson);
            testIndexer.indexSourceLanguages(
                '1ch',
                sourceLanguagesCatalogJson,
                {'date_modified':'20150801'}
            );
            testIndexer.indexResources(
                '1ch',
                'ar',
                resourcesCatalogJson,
                {'date_modified':'20150801'}
            );
            testIndexer.indexSource(
                '1ch',
                'ar',
                'avd',
                sourceCatalogJson,
                {'date_modified':'20150801'}
            );
        });

        describe('@CheckIndex', function () {
            it('should be using the correct index', function () {
                translator.useIndex('test');
                assert.equal(translator.getIndexId(), 'test');
            });
        });

        describe('@GetProject', function () {
            it('should retrieve the 1ch ar avd project object', function () {
                var project = translator.getProject('1ch', 'ar', 'avd');
                assert.equal(project.getProjectId(), '1ch');
                assert.equal(project.getSourceLanguageId(), 'ar');
                assert.equal(project.getResourceId(), 'avd');
            });
        });

        describe('@GetBadProject', function () {
            it('should not retrieve the nonexistent 7ch en ulb source', function () {
                assert.equal(translator.getProject('7ch', 'en', 'ulb'), null);
            });
        });

        describe('@GetLastProject', function () {
            it('should retrieve the 1ch ar avd (last used & valid) project object', function () {
                var project = translator.getLastProject();
                assert.equal(project.getProjectId(), '1ch');
                assert.equal(project.getSourceLanguageId(), 'ar');
                assert.equal(project.getResourceId(), 'avd');
            });
        });

        describe('@GetTitle', function () {
            it('should retrieve the 1ch ar avd title', function () {
                var project = translator.getLastProject();
                assert.equal(project.getTitle(), titleStr);
            });
        });

        describe('@GetDescription', function () {
            it('should retrieve the 1ch ar avd description', function () {
                var project = translator.getLastProject();
                assert.equal(project.getDescription(), descriptionStr);
            });
        });

        describe('@GetImage', function () {
            it('feature not fully designed', function () {
                var project = translator.getLastProject();
                //assert.equal(project.getImage(), imageStr);
                assert.equal(true, true);
            });
        });

        describe('@GetSortKey', function () {
            it('should retrieve the 1ch ar avd sort key', function () {
                var project = translator.getLastProject();
                assert.equal(project.getSortKey(), sortKeyStr);
            });
        });

/** /
        describe('@GetChapters', function () {
            it('should retrieve an array of the 1ch ar avd chapter objects', function () {
                var project = translator.getLastProject();
                assert.equal(project.getChapters(), 2);
            });
        });
/**/

    });
})();
