/**
 * Created by delmarhager on 5/25/15.
 */
var assert = require('assert');
var indexer = require('../../app/js/indexer');
var index = require('./data/resources');
var path = require('path');
var dataDir = __dirname + path.sep + 'data';
var bookSource = require('./data/1ch.en.ulb.source.json');
var languageResource = require('./data/languageResource.json');
var projectResource = require('./data/projectResource.json');
var firstCo = require('./data/1co.json');
var firstCo13 = firstCo.chapters[12];
var firstCo13Frame = firstCo.chapters[12].frames[2];
describe('@Indexer', function () {
    beforeEach(function(done) {
        indexer.setOptions ({index:index, rootDir:dataDir});
        done();
    });

    describe('@getResourcePathProject ', function () {
        it('should retrieve a 1ch project lang_catalog path', function () {
            var text = '/agilebuilders/ts-desktop/unit_tests/indexer/data/tsFiles/ts/txt/2/1ch/languages.json';
            assert.equal(indexer.getResourcePath('1ch.lang_catalog', index, dataDir), text);
        })
    })

    describe('@getResourcePathArabicSource ', function () {
        it('should retrieve a 1ch ar udb source path', function () {
            var text = '/agilebuilders/ts-desktop/unit_tests/indexer/data/tsFiles/ts/txt/2/1co/ar/avd/source.json';
            assert.equal(indexer.getResourcePath('1co.ar.avd.source',index, dataDir), text);
        })
    })

    describe('@readProject ', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(indexer.readProject('1ch', {index:index, rootDir:dataDir})).replace(/ /g, ''), JSON.stringify(projectResource).replace(/ /g, ''));
        })
    })


    describe('@ReadLangurage ', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(indexer.read('1ch','en' )).replace(/ /g, ''), JSON.stringify(languageResource).replace(/ /g, ''));
        })
    })


    describe('@ReadSource ', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(indexer.read('1ch','en','ulb')).replace(/ /g, ''), JSON.stringify(bookSource).replace(/ /g, ''));
        })
    })

    describe('@ReadSourceChapter ', function () {
        it('should retrieve the 1co chapter', function () {
            assert.equal(JSON.stringify(indexer.read('1co','en','udb','13')).replace(/ /g, ''), JSON.stringify(firstCo13).replace(/ /g, ''));
        })
    })

    describe('@ReadSourceChapterFrame ', function () {
        it('should retrieve the 1co frame', function () {
            assert.equal(JSON.stringify(indexer.read('1co','en','udb','13','3')).replace(/ /g, ''), JSON.stringify(firstCo13Frame).replace(/ /g, ''));
        })
    })

    describe('@ReadProject ', function () {
        it('should retrieve the 1ch source', function () {
            assert.equal(JSON.stringify(indexer.read('1ch' )).replace(/ /g, ''), JSON.stringify(projectResource).replace(/ /g, ''));
        })
    })
})
