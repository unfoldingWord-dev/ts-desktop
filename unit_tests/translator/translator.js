var assert = require('assert');
var rimraf = require('rimraf');
var path = require('path');
var Indexer = require('../../app/js/indexer').Indexer;
var testIndexer = new Indexer('test');
var Translator = require('../../app/js/translator').Translator;
var translator = new Translator(testIndexer);

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

        before(function (done) {
            var setupIndex = function () {
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
            };
            var testPath = testIndexer.getIndexPath();
            if (testPath.indexOf(path.join('index', 'test')) !== -1) {
                rimraf(testPath, function () {
                    setupIndex();
                    done();
                });
            } else {
                setupIndex();
                done();
            }
        });

        after(function (done) {
            var testPath = testIndexer.getIndexPath();
            if (testPath.indexOf(path.join('index', 'test')) !== -1) {
                rimraf(testPath, function () {
                    done();
                });
            } else {
                done();
            }
        });

        describe('@CheckIndex', function () {
            it('should be using the correct index', function () {
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

        describe('@DoNotGetBadProject', function () {
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

        describe('@Project', function () {

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
                    assert.equal(project.getImage(), imageStr);
                });
            });

            describe('@GetSortKey', function () {
                it('should retrieve the 1ch ar avd sort key', function () {
                    var project = translator.getLastProject();
                    assert.equal(project.getSortKey(), sortKeyStr);
                });
            });

            describe('@GetChapters', function () {
                it('should retrieve an array of the 1ch ar avd chapter objects', function () {
                    var project = translator.getLastProject();
                    var chapters = project.getChapters();
                    assert.equal(Object.keys(chapters).length, 29);
                });
            });

            describe('@GetChapter', function () {
                it('should retrieve the 1ch ar avd chapter 01 object', function () {
                    var project = translator.getLastProject();
                    var chapter = project.getChapter('01');
                    assert.equal(chapter.getNumber(), '01');
                    assert.equal(chapter.getReference(), '');
                    assert.equal(chapter.getTitle(), '');
                });
            });

            describe('@GetFrames', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame objects from the project object', function () {
                    var project = translator.getLastProject();
                    var frames = project.getFrames('01');
                    assert.equal(Object.keys(frames).length, 17);
                });
            });

            describe('@GetFrame', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame 01 object from the project object', function () {
                    var project = translator.getLastProject();
                    var frame = project.getFrame('01', '01');
                    assert.equal(frame.hasOwnProperty('getSource'), true);
                });
            });

        });

        describe('@Chapter', function () {

            describe('@GetFrames', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame objects from the chapter object', function () {
                    var project = translator.getLastProject();
                    var chapter = project.getChapter('01');
                    var frames = chapter.getFrames();
                    assert.equal(Object.keys(frames).length, 17);
                });
            });

            describe('@GetFrame', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame 01 object from the chapter object', function () {
                    var project = translator.getLastProject();
                    var chapter = project.getChapter('01');
                    var frame = chapter.getFrame('01');
                    assert.equal(frame.hasOwnProperty('getSource'), true);
                });
            });

        });

    });
})();
