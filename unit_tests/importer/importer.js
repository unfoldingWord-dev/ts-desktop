'use strict';

process.env.NODE_ENV = 'test';

let fs = require('fs');
let path = require('path');
let ProjectsManager = require('../../app/js/projects').ProjectsManager;
let Importer = require('../../app/js/importer').Importer;
let Library = require('../../app/js/library').Library;
let library = new Library(path.join('./app', 'config', 'schema.sql'), './app/index/index.sqlite', 'https://api.unfoldingword.org/ts/txt/2/catalog.json');

let targetDir = path.resolve('./unit_tests/importer/data');

let translation = {
    "generator": {
        "name": "ts-desktop",
        "build": ""
    },
    "package_version": 3,
    "target_language": {
        "id": "es",
        "name": "español",
        "direction": "ltr"
    },
    "project": {
        "id": "mat",
        "name": "Matthew",
        "type": "text"
    },
    "resource_id": "ulb",
    "source_translations": {
        "mat-en-ulb": {
            "checking_level": 3,
            "date_modified": 20151217,
            "version": "3"
        }
    },
    "parent_draft_resource_id": "",
    "translators": [],
    "finished_frames": [],
    "sources": [
        {
            "id": 136,
            "source": "ulb",
            "name": "Unlocked Literal Bible",
            "ln": "English",
            "lc": "en",
            "project": "mat",
            "level": 3,
            "version": "3",
            "date_modified": 20151217
        }
    ],
    "currentsource": 0,
    "type_name": "Text",
    "basename": "mat-es",
    "fullname": "mat-es",
    "completion": 99
}

let config = {
    getValue: function (k) {
        let i = {
            'targetTranslationsDir': targetDir
        };
        return i[k];
    }
};

let query = function () { return []; };
let db = library.indexer.db;


let pm = new ProjectsManager(db.exec.bind(db), config);

describe('@Importer', function () {

    describe('@UsfmImport', function () {
        it('should import a sample ufsm file', function (done) {
            var file = {
                name: "matthew.usfm",
                path: path.resolve('unit_tests/importer/data/matthew.usfm')
            };
            try{
                let importer = new Importer(config,pm);

                importer.importUSFMFile(file,translation).then(function(){
                    done();
                }).catch(function(e){
                    console.log('there was an error', e);
                });

                /*pm.loadTargetTranslation(translation).then(function(proj) {
                    console.log("project", proj);
                });*/
            } catch( e ){
                console.log(e.stack);
            }

        });

    });

    //cleanup
    after(function (done) {
        done();
    });

});
