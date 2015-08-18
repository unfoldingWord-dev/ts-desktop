'use strict';

;(function () {

    let assert = require('assert');
    let rimraf = require('rimraf');
    let Indexer = require('../../app/js/indexer').Indexer;
    let Configurator = require('../../app/js/configurator').Configurator;
    let configurator = new Configurator();
    let config = require('../../app/config/defaults');
    configurator.setStorage({});
    configurator.loadConfig(config);
    let indexConfig = {
        apiUrl: configurator.getValue('apiUrl'),
        indexDir: './unit_tests/translator/index/'
    };
    let testIndexer = new Indexer('test', indexConfig);
    let Translator = require('../../app/js/translator').Translator;
    let translator = new Translator(testIndexer);

    //import comparison data
    let projectsCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/catalog.json'));
    let sourceLanguagesCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/1ch/languages.json'));
    let resourcesCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/1ch/ar/resources.json'));
    let sourceCatalogJson = JSON.stringify(require('../indexer/data/ts/txt/2/1ch/ar/avd/source.json'));
    let project = JSON.parse(sourceLanguagesCatalogJson)[1].project;
    let titleStr = project.name;
    let descriptionStr = project.desc;
    let imageStr = '';//TODO: where do we get this???
    let sortKeyStr = project.sort;

    describe('@Translator', function () {

        before(function (done) {
            let setupIndex = function () {
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
            rimraf(indexConfig.indexDir, function () {
                setupIndex();
                done();
            });
        });

        after(function (done) {
            rimraf(indexConfig.indexDir, function () {
                done();
            });
        });

        describe('@CheckIndex', function () {
            it('should be using the correct index', function () {
                assert.equal(translator.getIndexId(), 'test');
            });
        });

        describe('@GetProject', function () {
            it('should retrieve the 1ch ar avd project object', function () {
                let project = translator.getProject('1ch', 'ar', 'avd');
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
                let project = translator.getLastProject();
                assert.equal(project.getProjectId(), '1ch');
                assert.equal(project.getSourceLanguageId(), 'ar');
                assert.equal(project.getResourceId(), 'avd');
            });
        });

        describe('@Project', function () {

            describe('@GetTitle', function () {
                it('should retrieve the 1ch ar avd title', function () {
                    let project = translator.getLastProject();
                    assert.equal(project.getTitle(), titleStr);
                });
            });

            describe('@GetDescription', function () {
                it('should retrieve the 1ch ar avd description', function () {
                    let project = translator.getLastProject();
                    assert.equal(project.getDescription(), descriptionStr);
                });
            });

            describe('@GetImage', function () {
                it('feature not fully designed', function () {
                    let project = translator.getLastProject();
                    assert.equal(project.getImage(), imageStr);
                });
            });

            describe('@GetSortKey', function () {
                it('should retrieve the 1ch ar avd sort key', function () {
                    let project = translator.getLastProject();
                    assert.equal(project.getSortKey(), sortKeyStr);
                });
            });

            describe('@GetChapters', function () {
                it('should retrieve an array of the 1ch ar avd chapter objects', function () {
                    let project = translator.getLastProject();
                    let chapters = project.getChapters();
                    assert.equal(Object.keys(chapters).length, 29);
                });
            });

            describe('@GetChapter', function () {
                it('should retrieve the 1ch ar avd chapter 01 object', function () {
                    let project = translator.getLastProject();
                    let chapter = project.getChapter('01');
                    assert.equal(chapter.getNumber(), '01');
                    assert.equal(chapter.getReference(), '');
                    assert.equal(chapter.getTitle(), '');
                });
            });

            describe('@GetFrames', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame objects from the project object', function () {
                    let project = translator.getLastProject();
                    let frames = project.getFrames('01');
                    assert.equal(Object.keys(frames).length, 17);
                });
            });

            describe('@GetFrame', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame 01 object from the project object', function () {
                    let project = translator.getLastProject();
                    let frame = project.getFrame('01', '01');
                    assert.equal(frame.hasOwnProperty('getSource'), true);
                });
            });

        });

        describe('@Chapter', function () {

            describe('@GetFrames', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame objects from the chapter object', function () {
                    let project = translator.getLastProject();
                    let chapter = project.getChapter('01');
                    let frames = chapter.getFrames();
                    assert.equal(Object.keys(frames).length, 17);
                });
            });

            describe('@GetFrame', function () {
                it('should retrieve an array of the 1ch ar avd chapter 01 frame 01 object from the chapter object', function () {
                    let project = translator.getLastProject();
                    let chapter = project.getChapter('01');
                    let frame = chapter.getFrame('01');
                    assert.equal(frame.hasOwnProperty('getSource'), true);
                });
            });

        });

    });
})();
