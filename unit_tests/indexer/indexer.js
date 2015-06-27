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
path:'/ts/txt/2/1ch/en/resources.json'


var projectResource = require('./data/projectResource.json');

describe('@Indexer', function () {
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

// begin API testing
// the index and dataDir are not part of the API. They are optional for testing.

    describe('@readProject ', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(indexer.readProject('1ch', {index:index, rootDir:dataDir})).replace(/ /g, ''), JSON.stringify(projectResource).replace(/ /g, ''));
        })
    })


    describe('@ReadLangurage ', function () {
        it('should retrieve the 1ch project', function () {
            indexer.setOptions ({index:index, rootDir:dataDir});
            assert.equal(JSON.stringify(indexer.read('1ch','en' )).replace(/ /g, ''), JSON.stringify(languageResource).replace(/ /g, ''));
        })
    })


    describe('@ReadSource ', function () {
        it('should retrieve the 1ch project', function () {
            indexer.setOptions ({index:index, rootDir:dataDir});
            assert.equal(JSON.stringify(indexer.read('1ch','en','ulb')).replace(/ /g, ''), JSON.stringify(bookSource).replace(/ /g, ''));
        })
    })

    describe('@ReadProject ', function () {
        it('should retrieve the 1ch source', function () {

            indexer.setOptions ({index:index, rootDir:dataDir});
            assert.equal(JSON.stringify(indexer.read('1ch' )).replace(/ /g, ''), JSON.stringify(projectResource).replace(/ /g, ''));
        })
    })
})
