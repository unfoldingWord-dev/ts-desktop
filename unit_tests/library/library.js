'use strict';

;(function () {

    let assert = require('assert');
    //let rimraf = require('rimraf');
    let SourceTranslation = require('../../app/js/core/sourcetranslation');
    let Configurator = require('../../app/js/configurator').Configurator;
    let configurator = new Configurator();
    let config = require('../../app/config/defaults');
    configurator.setStorage({});
    configurator.loadConfig(config);

    let Library = require('../../app/js/library').Library;
    let indexPath = './app/index/app.sqlite';
    let library = new Library(indexPath, configurator.getValue('apiUrl'));

    describe('@Library', function () {

        describe('@GetProjects', function () {
            it('should retrieve the catalog object', function () {
                assert.equal(library.getProjects().length > 0, true);
            });
        });

        describe('@GetProject', function () {
            it('should retrieve the 1ch ar avd project object', function () {
                let project = library.getProject('1ch', 'ar');
                assert.equal(project.getSlug(), '1ch');
                assert.equal(project.getSourceLanguageSlug(), 'ar');
            });
        });

        describe('@DoNotGetBadProject', function () {
            it('should not retrieve the nonexistent 7ch en source', function () {
                assert.equal(library.getProject('7ch', 'en'), null);
            });
        });

        describe('@GetTargetLanguages', function () {
            it('should return all the target languages', function () {
               assert.equal(
                   library.getTargetLanguages().length > 0,
                   true
               );
           }) ;
        });

        describe('@GetSourceLanguages', function () {
           it('should return the source languages for 1ch', function () {
               assert.equal(
                   library.getSourceLanguages('1ch').length > 0,
                   true
               );
           });
        });

        describe('@GetSourceLanguage', function () {
            it('should return the source en for 1ch', function () {
                let sourceLanguage = library.getSourceLanguage('1ch', 'en');
                assert.notEqual(
                    sourceLanguage,
                    null
                );
                assert.equal(
                    sourceLanguage.getSlug(),
                    'en'
                );
            });
        });

        describe('@GetPreferredSourceLanguage', function () {
            it('should return the en language for 1ch', function () {
                assert.notEqual(
                    library.getPreferredSourceLanguage('1ch', 'en'),
                    null
                );
            });
            it('should return the default language', function () {
                let sourceLanguage = library.getPreferredSourceLanguage('1ch', 'fakelanguage');
                assert.notEqual(
                    sourceLanguage,
                    null
                );
                assert.notEqual(
                    sourceLanguage,
                    'fakelanguage'
                );
            });
        });

        describe('@GetResources', function () {
            it('should return the resources for 1ch en', function () {
                assert.equal(
                    library.getResources('1ch', 'en').length > 0,
                    true
                );
            });
        });

        describe('@GetResource', function () {
            it('should return the resource for 1ch en ulb', function () {
                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
                let resource = library.getResource(sourceTranslation);
                assert.notEqual(
                    resource,
                    null
                );
                assert.equal(
                    resource.getSlug(),
                    'ulb'
                );
            });
        });

        describe('@GetChapters', function () {
            it('should return the chapters for 1ch en ulb', function () {
                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
                assert.equal(
                    library.getChapters(sourceTranslation).length > 0,
                    true
                );
            });
        });

        describe('@GetChapter', function () {
            it('should return a single chapter 1ch en ulb 01', function () {
                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
                let chapter = library.getChapter(sourceTranslation, '01');
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

        describe('@GetFrames', function () {
            it('should return the frames for 1ch en ulb 01', function () {
                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
                assert.equal(
                    library.getFrames(sourceTranslation, '01').length > 0,
                    true
                );
            });
        });

        describe('@GetFrame', function () {
            it('should return a single frame for 1ch en ulb 01 01', function () {
                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
                let frame = library.getFrame(sourceTranslation, '01', '01');
                assert.notEqual(
                    frame,
                    null
                );
                assert.equal(
                    frame.getSlug(),
                    '01'
                );
            });
        });

        describe('@GetChapterBody', function () {
            it('should return the body of the chapter 1ch en ulb 01', function () {
                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
                let body = library.getChapterBody(sourceTranslation, '01');
                assert.notEqual(
                    body,
                    null
                );
                assert.equal(
                    body.length > 0,
                    true
                );
            });
        });

        describe('@GetSourceTranslation', function () {
            it('should return the source translation 1ch en ulb', function () {
                let sourceTranslation = library.getSourceTranslation('1ch', 'en', 'ulb');
                assert.notEqual(
                    sourceTranslation,
                    null
                );
            });
        });
    });
})();
