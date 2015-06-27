/**
 * Created by delmarhager on 5/25/15.
 */
var assert = require('assert');
var indexer = require('../../app/js/indexer');
var index = require('./data/resources');
var path = require('path');
var dataDir = __dirname + path.sep + 'data';
var languageResource = {
    value: '[{"checking_questions": "", "date_modified": "20150604", "name": "Unlocked Dynamic Bible", "notes": "https://api.unfoldingword.org/ts/txt/2/1ch/en/notes.json?date_modified=20150604", "slug": "udb", "source": "https://api.unfoldingword.org/ts/txt/2/1ch/en/udb/source.json?date_modified=20150604", "status": {"checking_entity": "Wycliffe Associates", "checking_level": "3", "comments": "Original source text", "contributors": "Wycliffe Associates", "publish_date": "20150604", "source_text": "en", "source_text_version": "2.0.0-beta8", "version": "2.0.0-beta8"}, "terms": "https://api.unfoldingword.org/ts/txt/2/bible/en/terms.json?date_modified=20150604", "usfm": "https://api.unfoldingword.org/udb/txt/1/udb-en/13-1CH.usfm?date_modified=20150604"}, {"checking_questions": "", "date_modified": "20150604", "name": "Unlocked Literal Bible", "notes": "https://api.unfoldingword.org/ts/txt/2/1ch/en/notes.json?date_modified=20150604", "slug": "ulb", "source": "https://api.unfoldingword.org/ts/txt/2/1ch/en/ulb/source.json?date_modified=20150604", "status": {"checking_entity": "Wycliffe Associates", "checking_level": "3", "comments": "Original source text", "contributors": "Wycliffe Associates", "publish_date": "20150604", "source_text": "en", "source_text_version": "2.0.0-beta8", "version": "2.0.0-beta8"}, "terms": "https://api.unfoldingword.org/ts/txt/2/bible/en/terms.json?date_modified=20150604", "usfm": "https://api.unfoldingword.org/ulb/txt/1/ulb-en/13-1CH.usfm?date_modified=20150604"}]',
    path: '/ts/txt/2/1ch/en/resources.json'
}
var projectResource = {
    value: '[{"language":{"date_modified":"20150604","direction":"ltr","name":"English","slug":"en"},"project":{"desc":"","meta":["Bible:OT"],"name":"1Chronicles","sort":"13"},"res_catalog":"https://api.unfoldingword.org/ts/txt/2/1ch/en/resources.json?date_modified=20150604"},{"language":{"date_modified":"20150401","direction":"rtl","name":"\u0627\u0644\u0639\u0631\u0628\u064a\u0629","slug":"ar"},"project":{"desc":"","meta":["Bible:OT"],"name":"\u0623\u064e\u062e\u0652\u0628\u064e\u0627\u0631\u0650\u0671\u0644\u0652\u0623\u064e\u064a\u0651\u064e\u0627\u0645\u0650\u0671\u0644\u0652\u0623\u064e\u0648\u0651\u064e\u0644\u064f","sort":"13"},"res_catalog":"https://api.unfoldingword.org/ts/txt/2/1ch/ar/resources.json?date_modified=20150401"}]',
    path: '/ts/txt/2/1ch/languages.json'
}

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
            assert.equal(JSON.stringify(indexer.readProject('1ch', {index:index, rootDir:dataDir})).replace(/ /g, ''), projectResource.value);
        })
    })


    describe('@Read ', function () {
        it('should retrieve the 1ch project', function () {
            indexer.setOptions ({index:index, rootDir:dataDir});
            assert.equal(JSON.stringify(indexer.read('1ch' )).replace(/ /g, ''), projectResource.value);
        })
    })
})
