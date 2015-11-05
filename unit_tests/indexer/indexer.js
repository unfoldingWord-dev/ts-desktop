'use strict';

;(function () {

    let path = require('path');
    let assert = require('assert');
    let rimraf = require('rimraf');
    let Indexer = require('../../app/js/indexer').Indexer;
    let Configurator = require('../../app/js/configurator').Configurator;
    let configurator = new Configurator();

    //import comparison data
    let projectsCatalogJson = JSON.stringify(require('./data/ts/txt/2/catalog.json'));
    let sourceLanguagesCatalogJson = JSON.stringify(require('./data/ts/txt/2/1ch/languages.json'));
    let resourcesCatalogJson = JSON.stringify(require('./data/ts/txt/2/1ch/ar/resources.json'));
    let sourceCatalogJson = JSON.stringify(require('./data/ts/txt/2/1ch/ar/avd/source.json'));
    let projectsSlugArray = JSON.stringify(require('./data/projects.json'));
    let sourceLanguagesSlugArray = JSON.stringify(require('./data/languages.json'));
    let resourcesSlugArray = JSON.stringify(require('./data/resources.json'));
    let chaptersSlugArray = JSON.stringify(require('./data/chapters.json'));
    let framesSlugArray = JSON.stringify(require('./data/frames.json'));
    let projectCatalogJson = JSON.stringify(require('./data/1ch.json'));
    let sourceLanguageCatalogJson = JSON.stringify(require('./data/ar.json'));
    let resourceCatalogJson = JSON.stringify(require('./data/avd.json'));
    let chapterCatalogJson = JSON.stringify(require('./data/chapter.json'));
    let frameCatalogJson = JSON.stringify(require('./data/01.json'));

    let config = require('../../app/config/defaults');
    configurator.setStorage({});
    configurator.loadConfig(config);

    let indexDir = './unit_tests/indexer/index/';
    let testIndexer = new Indexer(path.resolve('./app/config/schema.sql'), path.join(indexDir, 'app.sqlite'));

    describe('@Indexer', function () {

        before(function (done) {
            rimraf(indexDir, function () {
                done();
            });
        });

        after(function (done) {
            rimraf(indexDir, function () {
                done();
            });
        });

        describe('@DataTools', function() {
            this.timeout(4000);
            let index = new Indexer(path.resolve('./app/config/schema.sql'), './app/index/app.sqlite');

            it('should have projects', function() {
                assert.equal(
                    index.getProjects('en').length > 0,
                    true
                );
            });
            it('should have target languages', function() {
               assert.equal(
                   index.getTargetLanguages().length > 0,
                   true
               );
            });
        });

        describe('@IndexingTools', function () {

            describe('@IndexProjects', function () {
                it('should index projects catalog', function () {
                    this.timeout(3500);
                    assert.equal(
                        testIndexer.indexProjects(projectsCatalogJson),
                        true
                    );
                    assert.equal(
                        testIndexer.getProjects('en').length > 0,
                        true
                    );
                });
            });

            describe('@IndexSourceLanguages', function () {
                it('should index 1ch source languages catalog', function () {
                    assert.equal(
                        testIndexer.indexSourceLanguages(
                            '1ch',
                            sourceLanguagesCatalogJson
                        ),
                        true
                    );
                    assert.equal(
                        testIndexer.getSourceLanguages('1ch').length > 0,
                        true
                    );
                });
            });

            describe('@IndexResources', function () {
                it('should index 1ch ar resources catalog', function () {
                    assert.equal(
                        testIndexer.indexResources(
                            '1ch',
                            'ar',
                            resourcesCatalogJson,
                            {'date_modified':'20150801'}
                        ),
                        true
                    );
                    assert.equal(
                        testIndexer.getResources('1ch', 'ar').length > 0,
                        true
                    );
                });
            });

            describe('@IndexSource', function () {
                it('should index 1ch ar avd source catalog', function () {
                    this.timeout(5000);
                    assert.equal(
                        testIndexer.indexSource(
                            '1ch',
                            'ar',
                            'avd',
                            sourceCatalogJson,
                            {'date_modified':'20150801'}
                        ),
                        true
                    );
                    assert.equal(
                        testIndexer.getChapters('1ch', 'ar', 'avd').length > 0,
                        true
                    );
                    assert.equal(
                        testIndexer.getFrames('1ch', 'ar', 'avd', '01').length > 0,
                        true
                    );
                });
            });

            describe('@IndexNotes', function () {
                it('should index notes', function () {
                    this.timeout(5000);
                    // todo index
                    //assert.equal(
                    //    testIndexer.getTranslationNotes('1ch', 'en', 'ulb', '01', '01').length > 0,
                    //    true
                    //);
                });
            });

            describe('@IndexWords', function () {
                it('should index words', function () {
                    this.timeout(5000);
                    // todo index
                    //assert.equal(
                    //    testIndexer.getTranslationWordsForFrame('1ch', 'en', 'ulb', '01', '01').length > 0,
                    //    true
                    //);
                });
            });

            describe('@IndexQuestions', function () {
                it('should index questions', function () {
                    this.timeout(5000);
                    // todo index
                    //assert.equal(
                    //    testIndexer.getCheckingQuestions('1ch', 'en', 'ulb', '01', '01').length > 0,
                    //    true
                    //);
                });
            });

        });

        describe('@ListRetrievalTools', function () {

            describe('@GetProjects', function () {
                it('should get projects slug array', function () {
                    assert.equal(
                        testIndexer.getProjects('en').length > 0,
                        true
                    );
                });
            });

            describe('@GetSourceLanguages', function () {
                it('should get 1ch source languages slug array', function () {
                    assert.equal(
                        testIndexer.getSourceLanguages('1ch').length > 0,
                        true
                    );
                });
            });

            describe('@GetResources', function () {
                it('should get 1ch ar resource slug array', function () {
                    assert.equal(
                        testIndexer.getResources('1ch', 'ar').length > 0,
                        true
                    );
                });
            });

            describe('@GetChapters', function () {
                it('should get 1ch ar avd chapters slug array', function () {
                    assert.equal(
                        testIndexer.getChapters('1ch', 'ar', 'avd').length > 0,
                        true
                    );
                });
            });

            describe('@GetFrames', function () {
                it('should get 1ch ar avd chapter 01 frames slug array', function () {
                    assert.equal(
                        testIndexer.getFrames(
                            '1ch',
                            'ar',
                            'avd',
                            '01'
                        ).length > 0,
                        true
                    );
                });
            });

        });

        describe('@ItemRetrievalTools', function () {

            describe('@GetProject', function () {
                it('should get 1ch project', function () {
                    let project = testIndexer.getProject('1ch', 'en');
                    assert.notEqual(
                        project,
                        null
                    );
                    assert.equal(project.getSlug(), '1ch');
                });
            });

            describe('@GetSourceLanguage', function () {
                it('should get 1ch ar source language', function () {
                    let sourceLanguage = testIndexer.getSourceLanguage('1ch', 'ar');
                    assert.notEqual(
                        sourceLanguage,
                        null
                    );
                    assert.equal(
                        sourceLanguage.getSlug(),
                        'ar'
                    );
                });
            });

            describe('@GetResource', function () {
                it('should get 1ch ar avd resource', function () {
                    let resource = testIndexer.getResource(
                            '1ch',
                            'ar',
                            'avd');
                    assert.notEqual(resource,
                        null
                    );
                    assert.equal(resource.getSlug(), 'avd');
                });
            });

            describe('@GetChapter', function () {
                it('should get 1ch ar avd chapter 01', function () {
                    let chapter = testIndexer.getChapter(
                        '1ch',
                        'ar',
                        'avd',
                        '01'
                    );
                    assert.notEqual(
                        chapter,
                        null
                    );
                    assert.equal(
                        chapter.getSlug(),
                        '01'
                    );
                });
            });

            describe('@GetFrame', function () {
                it('should get 1ch ar avd chapter 01 frame 01', function () {
                    let frame = testIndexer.getFrame(
                        '1ch',
                        'ar',
                        'avd',
                        '01',
                        '01'
                    );
                    assert.notEqual(
                        frame,
                        null
                    );
                    assert.equal(
                        frame.getSlug(),
                        '01'
                    );
                    assert.equal(
                        frame.getChapterSlug(),
                        '01'
                    );
                });
            });

            describe('@GetNotes', function () {
                it('should return the translation notes', function () {
                    //assert.equal(
                    //    testIndexer.getTranslationNotes('1ch', 'en', 'ulb', '01', '01').length > 0,
                    //    true
                    //);
                });
            });

            describe('@GetWords', function () {
                it('should return the translation words', function () {
                    //assert.equal(
                    //    testIndexer.getTranslationWordsForFrame('1ch', 'en', 'ulb', '01', '01').length > 0,
                    //    true
                    //);
                });
            });

            describe('@GetQuestions', function () {
                it('should return the checking questions', function () {
                    //assert.equal(
                    //    testIndexer.getCheckingQuestions('1ch', 'en', 'ulb', '01', '01').length > 0,
                    //    true
                    //);
                });
            });

        });

    });

})();
