var assert = require('assert');
var Indexer = require('../../app/js/indexer').Indexer;
var testIndexer = new Indexer('test');
var configurator = require('../../app/js/configurator');

var projectsCatalogJson = JSON.stringify(require('./data/ts/txt/2/catalog.json'));
var sourceLanguagesCatalogJson = JSON.stringify(require('./data/ts/txt/2/1ch/languages.json'));
var resourcesCatalogJson = JSON.stringify(require('./data/ts/txt/2/1ch/ar/resources.json'));
var sourceCatalogJson = JSON.stringify(require('./data/ts/txt/2/1ch/ar/avd/source.json'));
var projectsSlugArray = JSON.stringify(require('./data/projects.json'));
var sourceLanguagesSlugArray = JSON.stringify(require('./data/languages.json'));
var resourcesSlugArray = JSON.stringify(require('./data/resources.json'));
var chaptersSlugArray = JSON.stringify(require('./data/chapters.json'));
var framesSlugArray = JSON.stringify(require('./data/frames.json'));
var projectCatalogJson = JSON.stringify(require('./data/1ch.json'));
var sourceLanguageCatalogJson = JSON.stringify(require('./data/ar.json'));
var resourceCatalogJson = JSON.stringify(require('./data/avd.json'));
var chapterCatalogJson = JSON.stringify(require('./data/chapter.json'));
var frameCatalogJson = JSON.stringify(require('./data/01.json'));

;(function () {
    'use strict';

    describe('@Indexer', function () {

        before(function() {
            configurator.setValue('rootDir', './');
        });

        describe('@IndexProjects', function () {
            it('should index projects catalog', function () {
                assert.equal(
                    testIndexer.indexProjects(projectsCatalogJson),
                    true
                );
            });
        });

        describe('@IndexSourceLanguages', function () {
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
            });
        });

        describe('@IndexSource', function () {
            it('should index 1ch ar avd source catalog', function () {
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
            });
        });

        describe('@IndexNotes', function () {
            it('feature not fully designed', function () {
                assert.equal(
                    true,
                    true
                );
            });
        });

        describe('@IndexTerms', function () {
            it('feature not fully designed', function () {
                assert.equal(
                    true,
                    true
                );
            });
        });

        describe('@IndexQuestions', function () {
            it('feature not fully designed', function () {
                assert.equal(
                    true,
                    true
                );
            });
        });

        describe('@GetProjects', function () {
            it('should get projects slug array', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getProjects()
                    ),
                    projectsSlugArray
                );
            });
        });

        describe('@GetSourceLanguages', function () {
            it('should get 1ch source languages slug array', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getSourceLanguages(
                            '1ch'
                        )
                    ),
                    sourceLanguagesSlugArray
                );
            });
        });

        describe('@GetResources', function () {
            it('should get 1ch ar resource slug array', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getResources(
                            '1ch',
                            'ar'
                        )
                    ),
                    resourcesSlugArray
                );
            });
        });

        describe('@GetChapters', function () {
            it('should get 1ch ar avd chapters slug array', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getChapters(
                            '1ch',
                            'ar',
                            'avd'
                        )
                    ),
                    chaptersSlugArray
                );
            });
        });

        describe('@GetFrames', function () {
            it('should get 1ch ar avd chapter 01 frames slug array', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getFrames(
                            '1ch',
                            'ar',
                            'avd',
                            '01'
                        )
                    ),
                    framesSlugArray
                );
            });
        });

        describe('@GetProject', function () {
            it('should get 1ch project', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getProject(
                            '1ch'
                        )
                    ),
                    projectCatalogJson
                );
            });
        });

        describe('@GetSourceLanguage', function () {
            it('should get 1ch ar source language', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getSourceLanguage(
                            '1ch',
                            'ar'
                        )
                    ),
                    sourceLanguageCatalogJson
                );
            });
        });

        describe('@GetResource', function () {
            it('should get 1ch ar avd resource', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getResource(
                            '1ch',
                            'ar',
                            'avd'
                        )
                    ),
                    resourceCatalogJson
                );
            });
        });

        describe('@GetChapter', function () {
            it('should get 1ch ar avd chapter 01', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getChapter(
                            '1ch',
                            'ar',
                            'avd',
                            '01'
                        )
                    ),
                    chapterCatalogJson
                );
            });
        });

        describe('@GetFrame', function () {
            it('should get 1ch ar avd chapter 01 frame 01', function () {
                assert.equal(
                    JSON.stringify(
                        testIndexer.getFrame(
                            '1ch',
                            'ar',
                            'avd',
                            '01',
                            '01'
                        )
                    ),
                    frameCatalogJson
                );
            });
        });

        describe('@GetNotes', function () {
            it('feature not fully designed', function () {
                assert.equal(
                    true,
                    true
                );
            });
        });

        describe('@GetTerms', function () {
            it('feature not fully designed', function () {
                assert.equal(
                    true,
                    true
                );
            });
        });

        describe('@GetQuestions', function () {
            it('feature not fully designed', function () {
                assert.equal(
                    true,
                    true
                );
            });
        });

    });

})();
