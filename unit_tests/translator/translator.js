/**
 * Created by delmarhager on 5/25/15.
 */
var assert = require('assert');
var translator = require('../../app/js/translator');
var index = require('./data/resources');
var path = require('path');
var dataDir = __dirname + path.sep + 'data' + path.sep + 'tsFiles';
var bookSource = require('./data/1ch.en.ulb.source.json');
var languageResource = require('./data/languageResource.json');
var projectResource = require('./data/projectResource.json');
var firstCo = require('./data/1co.json');
var firstCo13 = firstCo.chapters[12];
var firstCo13Frame = firstCo.chapters[12].frames[2];


describe('@Translator', function () {
    beforeEach(function(done) {
        translator.setResources(dataDir, index);
        done();
    });

    describe('@getResourcePathProject ', function () {
        it('should retrieve a 1ch project lang_catalog path', function () {

            var text =  dataDir + '/ts/txt/2/1ch/languages.json'.replace(/\//gm, path.sep);
            assert.equal(translator.getResourcePath('1ch.lang_catalog', index, dataDir), text);
        })
    })

    describe('@getResourcePathArabicSource ', function () {
        it('should retrieve a 1ch ar udb source path', function () {
            var text = dataDir + '/ts/txt/2/1co/ar/avd/source.json'.replace(/\//gm, path.sep);
            assert.equal(translator.getResourcePath('1co.ar.avd.source',index, dataDir), text);
        })
    })

    describe('@readProject ', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(translator.readProject('1ch', {index:index, rootDir:dataDir})).replace(/ /g, ''), JSON.stringify(projectResource).replace(/ /g, ''));
        })
    })


    describe('@ReadLangurage ', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(translator.open('1ch','en' )).replace(/ /g, ''), JSON.stringify(languageResource).replace(/ /g, ''));
        })
    })


    describe('@ReadSource ', function () {
        it('should retrieve the 1ch project', function () {
            assert.equal(JSON.stringify(translator.open('1ch','en','ulb')).replace(/ /g, ''), JSON.stringify(bookSource).replace(/ /g, ''));
        })
    })

    describe('@ReadSourceChapter ', function () {
        it('should retrieve the 1co chapter', function () {
            assert.equal(JSON.stringify(translator.open('1co','en','udb','13')).replace(/ /g, ''), JSON.stringify(firstCo13).replace(/ /g, ''));
        })
    })

    describe('@ReadSourceChapterFrame ', function () {
        it('should retrieve the 1co frame', function () {
            assert.equal(JSON.stringify(translator.open('1co','en','udb','13','3')).replace(/ /g, ''), JSON.stringify(firstCo13Frame).replace(/ /g, ''));
        })
    })


    describe('@ReadBadProject ', function () {
        it('should not retrieve the 1co frame', function () {
            assert.equal(translator.open('1coc','en','udb','13','3'), null);
        })
    })


    describe('@ReadSourceChapterBadFrame ', function () {
        it('should not retrieve the 1co Bad frame', function () {
            assert.equal(translator.open('1co','en','udb','13','30'), null);
        })
    })

    describe('@ReadSourceChapterToManyArgs ', function () {
        it('should not retrieve the 1co To many args', function () {
            assert.equal(translator.open('1co','en','udb','13','30','40'), null);
        })
    })


    describe('@ReadSourceNoArgs ', function () {
        it('should not retrieve no args', function () {
            assert.equal(translator.open(), null);
        })
    })

    describe('@ReadSourceChapterBadResource ', function () {
        it('should not retrieve the 1co Bad Resource', function () {
            assert.equal(translator.open('1co','en','ddd','13','30'), null);
        })
    })


    describe('@ReadProject ', function () {
        it('should retrieve the 1ch source', function () {
            assert.equal(JSON.stringify(translator.open('1ch' )).replace(/ /g, ''), JSON.stringify(projectResource).replace(/ /g, ''));
        })
    })
})
