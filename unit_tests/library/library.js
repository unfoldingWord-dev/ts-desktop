//'use strict';
//
//;(function () {
//
//    let assert = require('assert');
//    let path = require('path');
//    //let rimraf = require('rimraf');
//    let SourceTranslation = require('../../src/js/core/sourcetranslation');
//    let Configurator = require('../../src/js/configurator').Configurator;
//    let configurator = new Configurator();
//    let config = require('../../src/config/defaults');
//    configurator.setStorage({});
//    configurator.loadConfig(config);
//
//    let Library = require('../../src/js/library').Library;
//    let indexPath = './src/index/index.sqlite';
//    let library = new Library(path.resolve('./src/config/schema.sql'), indexPath, configurator.getValue('apiUrl'));
//
//    describe('@Library', function () {
//
//        describe('@GetProjects', function () {
//            it('should retrieve the catalog object', function () {
//                assert.equal(library.getProjects('en').length > 0, true);
//            });
//        });
//
//        describe('@GetProject', function () {
//            it('should retrieve the 1ch ar avd project object', function () {
//                let project = library.getProject('1ch', 'ar');
//                assert.equal(project.getSlug(), '1ch');
//                assert.equal(project.getSourceLanguageSlug(), 'ar');
//            });
//        });
//
//        describe('@DoNotGetBadProject', function () {
//            it('should not retrieve the nonexistent 7ch en source', function () {
//                assert.equal(library.getProject('7ch', 'en'), null);
//            });
//        });
//
//        describe('@GetTargetLanguages', function () {
//            it('should return all the target languages', function () {
//                this.timeout(4000);
//               assert.equal(
//                   library.getTargetLanguages().length > 0,
//                   true
//               );
//            });
//
//            it('should return a single target language de', function () {
//                let targetLanguage = library.getTargetLanguage('de');
//                assert.notEqual(
//                    targetLanguage,
//                    null
//                );
//                assert.equal(
//                    targetLanguage.getSlug(),
//                    'de'
//                );
//            });
//        });
//
//        describe('@GetSourceLanguages', function () {
//           it('should return the source languages for 1ch', function () {
//               assert.equal(
//                   library.getSourceLanguages('1ch').length > 0,
//                   true
//               );
//           });
//        });
//
//        describe('@GetSourceLanguage', function () {
//            it('should return the source en for 1ch', function () {
//                let sourceLanguage = library.getSourceLanguage('1ch', 'en');
//                assert.notEqual(
//                    sourceLanguage,
//                    null
//                );
//                assert.equal(
//                    sourceLanguage.getSlug(),
//                    'en'
//                );
//            });
//        });
//
//        describe('@GetPreferredSourceLanguage', function () {
//            it('should return the en language for 1ch', function () {
//                assert.notEqual(
//                    library.getPreferredSourceLanguage('1ch', 'en'),
//                    null
//                );
//            });
//            it('should return the default language', function () {
//                let sourceLanguage = library.getPreferredSourceLanguage('1ch', 'fakelanguage');
//                assert.notEqual(
//                    sourceLanguage,
//                    null
//                );
//                assert.notEqual(
//                    sourceLanguage,
//                    'fakelanguage'
//                );
//            });
//        });
//
//        describe('@GetResources', function () {
//            it('should return the resources for 1ch en', function () {
//                assert.equal(
//                    library.getResources('1ch', 'en').length > 0,
//                    true
//                );
//            });
//        });
//
//        describe('@GetResource', function () {
//            it('should return the resource for 1ch en ulb', function () {
//                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
//                let resource = library.getResource(sourceTranslation);
//                assert.notEqual(
//                    resource,
//                    null
//                );
//                assert.equal(
//                    resource.getSlug(),
//                    'ulb'
//                );
//            });
//        });
//
//        describe('@GetChapters', function () {
//            it('should return the chapters for 1ch en ulb', function () {
//                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
//                assert.equal(
//                    library.getChapters(sourceTranslation).length > 0,
//                    true
//                );
//            });
//        });
//
//        describe('@GetChapter', function () {
//            it('should return a single chapter 1ch en ulb 01', function () {
//                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
//                let chapter = library.getChapter(sourceTranslation, '01');
//                assert.notEqual(
//                    chapter,
//                    null
//                );
//                assert.equal(
//                    chapter.getSlug(),
//                    '01'
//                );
//            });
//        });
//
//        describe('@GetFrames', function () {
//            it('should return the frames for 1ch en ulb 01', function () {
//                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
//                assert.equal(
//                    library.getFrames(sourceTranslation, '01').length > 0,
//                    true
//                );
//            });
//        });
//
//        describe('@GetFrame', function () {
//            it('should return a single frame for 1ch en ulb 01 01', function () {
//                let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
//                let frame = library.getFrame(sourceTranslation, '01', '01');
//                assert.notEqual(
//                    frame,
//                    null
//                );
//                assert.equal(
//                    frame.getSlug(),
//                    '01'
//                );
//            });
//        });
//
//        describe('@GetChapterBody', function () {
//            let sourceTranslation = SourceTranslation.simpleInstance('1ch', 'en', 'ulb');
//            let chapterSlug = '01';
//            it('should return the body of the chapter 1ch en ulb 01', function () {
//                let body = library.getChapterBody(sourceTranslation, chapterSlug);
//                assert.notEqual(
//                    body,
//                    null
//                );
//                assert.equal(
//                    body.length > 0,
//                    true
//                );
//            });
//
//            it('should have a usx translation format', function () {
//                assert.equal(
//                    library.getChapterBodyFormat(sourceTranslation, chapterSlug),
//                    'usx'
//                );
//            });
//        });
//
//        describe('@GetSourceTranslation', function () {
//            it('should return the source translation 1ch en ulb', function () {
//                let sourceTranslation = library.getSourceTranslation('1ch', 'en', 'ulb');
//                assert.notEqual(
//                    sourceTranslation,
//                    null
//                );
//            });
//
//            it('should return the default source translation', function() {
//                assert.notEqual(
//                    library.getDefaultSourceTranslation('1ch', 'en'),
//                    null
//                );
//            });
//        });
//
//        describe('@GetCheckingQuestions', function () {
//            let sourceTranslation = SourceTranslation.simpleInstance('obs', 'en', 'obs');
//            let checkingQuestions = library.getCheckingQuestions(sourceTranslation, '01', '01');
//
//            it('should return the checking questions for obs en obs 01 01', function () {
//                assert.equal(
//                    checkingQuestions.length > 0,
//                    true
//                );
//            });
//
//            it('should return the first checking question for obs en obs 01 01 ', function () {
//               let checkingQuestion = library.getCheckingQuestion(sourceTranslation, '01', '01', checkingQuestions[0].getSlug());
//                assert.notEqual(
//                    checkingQuestion,
//                    null
//                );
//            });
//        });
//
//        describe('@GetProjectCategories', function () {
//            it('should return an array of project categories', function () {
//                assert.equal(
//                    library.getProjectCategories('en').length > 0,
//                    true
//                );
//            });
//        });
//    });
//})();
