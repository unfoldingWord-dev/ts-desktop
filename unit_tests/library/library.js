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
                    resource.slug,
                    'ulb'
                );
            });
        });

        describe('@GetChapters', function () {
            it('should return the chapters for 1ch en ulb', function () {

                let resource = library.getChapters('1ch', 'en', 'ulb');
                assert.notEqual(
                    resource,
                    null
                );
                assert.equal(
                    resource.slug,
                    'ulb'
                );
            });
        });

        describe('@GetFrames', function () {
            it('should return the frames for 1ch en ulb 01', function () {

                let resource = library.getFrames('1ch', 'en', 'ulb', '01');
                assert.notEqual(
                    resource,
                    null
                );
                assert.equal(
                    resource.slug,
                    'ulb'
                );
            });
        });


    });
})();
