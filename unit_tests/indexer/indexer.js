'use strict';

;(function () {

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

    let indexConfig = {
        apiUrl: configurator.getValue('apiUrl'),
        indexDir: './unit_tests/indexer/index/'
    };
    let testIndexer = new Indexer('test', indexConfig);

    describe('@Indexer', function () {

        before(function (done) {
            rimraf(indexConfig.indexDir, function () {
                done();
            });
        });

        after(function (done) {
            rimraf(indexConfig.indexDir, function () {
                done();
            });
        });

        describe('@Utils', function () {

            describe('@GetIndexId', function () {
                it('should get correct index id', function () {
                    assert.equal(
                        testIndexer.getIndexId(),
                        'test'
                    );
                });
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

        });

        describe('@ListRetrievalTools', function () {

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

        });

        describe('@ItemRetrievalTools', function () {

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

    });

})();
