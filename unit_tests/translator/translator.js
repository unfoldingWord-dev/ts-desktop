/**
 * Created by delmarhager on 5/25/15.
 */
var assert = require('assert');
var translator = require('../../app/js/translator');
var index = require('./data/resources');
var path = require('path');
var resources = require('../../app/js/downloader');
var dataDir = __dirname + path.sep + 'data';
var bookSource = require('./data/1ch.en.ulb.source.json');
var languageResource = require('./data/languageResource.json');
var projectResource = require('./data/projectResource.json');
var firstCo = require('./data/1co.json');
var firstCo13 = firstCo.chapters[12];
var firstCo13Frame = firstCo.chapters[12].frames[2];
var pr = new resources.resources(dataDir);


describe('@Translator', function () {
    beforeEach(function(done) {
        pr.setOptions ({index:index, rootDir:dataDir});
        translator.setResources(pr);
        done();
    });

    describe('@CheckIndexing', function () {
        it('should set and get index', function () {
            var pr = new resources.resources(dataDir);
            var newIndex = {a: { b: {c: 'c'}}};
            pr.setTsIndex(newIndex);
            assert.equal(JSON.stringify( pr.tsIndex()).replace(/ /g, ''),JSON.stringify(newIndex).replace(/ /g, '') );
        })
    })

    describe('@GetResourcePathProject', function () {
        it('should retrieve a 1ch project lang_catalog path', function () {
            var text = dataDir + '/tsFiles/ts/txt/2/1ch/languages.json'.replace(/\//gm, path.sep);
            assert.equal(translator.getResourcePath('1ch.lang_catalog', index, dataDir), text);
        })
    })

    describe('@GetResourcePathArabicSource', function () {
        it('should retrieve a 1ch ar udb source path', function () {
            var text = dataDir + '/tsFiles/ts/txt/2/1co/ar/avd/source.json'.replace(/\//gm, path.sep);
            assert.equal(translator.getResourcePath('1co.ar.avd.source',index, dataDir), text);
        })
    })

    describe('@ReadProject', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(translator.readProject('1ch', {index:index, rootDir:dataDir})).replace(/ /g, ''), JSON.stringify(projectResource).replace(/ /g, ''));
        })
    })

    describe('@GetProject', function () {
        it('should retrieve the source: 1ch en ulb', function () {
            assert.equal(JSON.stringify(translator.getProject('1ch','en','ulb')).replace(/ /g, ''), JSON.stringify(bookSource).replace(/ /g, ''));
        })
    })

    describe('@GetBadProject', function () {
        it('should not retrieve the non-existant source: 2ch en ulb', function () {
            assert.equal(translator.getProject('2ch','en','ulb'), null);
        })
    })

    describe('@GetLastProject', function () {
        it('should retrieve the last valid source: 1ch en ulb', function () {
            assert.equal(JSON.stringify(translator.getLastProject()).replace(/ /g, ''), JSON.stringify(bookSource).replace(/ /g, ''));
        })
    })
/** / // still working out spec for these
    describe('@SetTargetLanguage', function () {
        it('should set the target language: fr', function () {
            assert.equal(translator.setTargetLanguage('fr'), 'fr');
        })
    })

    describe('@GetTargetLanguage', function () {
        it('should retrieve the target language: fr', function () {
            assert.equal(translator.getTargetLanguage(), 'fr');
        })
    })

    describe('@GetLastTargetLanguage', function () {
        it('should retrieve the last target language: fr', function () {
            assert.equal(translator.getLastTargetLanguage(), 'fr');
        })
    })
/**/
})
