'use strict';

;(function () {

    let rimraf = require('rimraf');
    let TargetLanguage = require('../../app/js/core/targetlanguage');
    let TargetTranslation = require('../../app/js/core/targettranslation');
    let Translator = require('../../app/js/translator').Translator;
    let assert = require('assert');

    let translationDir = './unit_tests/translator/data/';
    let translator = new Translator(null, translationDir); // todo need to pass in context

    describe('@Translator', function () {
        // prepare data
        let targetLanguage1 = TargetLanguage.newInstance({
            code:'en',
            name:'English',
            region:'America',
            direction:'ltr'
        });
        let targetLanguage2 = TargetLanguage.newInstance({
            code:'de',
            name:'Deutsch',
            region:'Europe',
            direction:'ltr'
        });
        let ttSlug1 = TargetTranslation.generateTargetTranslationSlug('en', 'obs');
        let ttSlug2 = TargetTranslation.generateTargetTranslationSlug('de', 'gen');

        before(function (done) {
            rimraf(translationDir, function () {
                done();
            });
        });

        after(function (done) {
            rimraf(translationDir, function () {
                done();
            });
        });

        describe('@CreateTargetTranslation', function() {
            it('should create a new target translation', function() {
                let tt1 = translator.createTargetTranslation(targetLanguage1, 'obs');
                let tt2 = translator.createTargetTranslation(targetLanguage2, 'gen');

                assert.notEqual(tt1, null);
                assert.equal(tt1.getTargetLanguageSlug(), 'en');
                assert.equal(tt1.getProjectSlug(), 'obs');
                assert.notEqual(tt2, null);
                assert.equal(tt2.getTargetLanguageSlug(), 'de');
                assert.equal(tt2.getProjectSlug(), 'gen');
            });
        });

        describe('@GetargetTranslation', function() {
            it('should return a target translation', function() {
                let tt1 = translator.getTargetTranslation(ttSlug1);
                let tt2 = translator.getTargetTranslation(ttSlug2);

                assert.notEqual(tt1, null);
                assert.equal(tt1.getTargetLanguageSlug(), 'en');
                assert.equal(tt1.getProjectSlug(), 'obs');
                assert.notEqual(tt2, null);
                assert.equal(tt2.getTargetLanguageSlug(), 'de');
                assert.equal(tt2.getProjectSlug(), 'gen');
            });
        });

        describe('@DeleteTargetTranslation', function() {
            it('should delete a target translation', function() {
                //translator.deleteTargetTranslation(tt1);
            });

            it('should not return a deleted target translation', function() {

            });
        });
    });
})();
