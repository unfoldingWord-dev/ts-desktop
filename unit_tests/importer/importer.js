'use strict';

process.env.NODE_ENV = 'test';

let fs = require('fs');
let path = require('path');
let ProjectsManager = require('../../app/js/projects').ProjectsManager;
let Importer = require('../../app/js/importer').Importer;
let importer = new Importer();

let targetDir = path.resolve('/Users/jeremymlane/Library/Application Support/translationstudio/targetTranslations');


let translation = {
    "generator":{
        "name":"ts-desktop",
        "build":""
    },
    "package_version":3,
    "target_language":{
        "id":"en",
        "name":"English",
        "direction":"ltr"
    },
    "project":{
        "id":"gen",
        "name":"Genesis",
        "type":"text"
    },
    "resource_id":"ulb",
    "source_translations":{

    },
    "parent_draft_resource_id":"",
    "translators":[

    ],
    "finished_frames":[

    ],
    "sources":[

    ],
    "currentsource":null,
    "type_name":"Text",
    "basename":"gen-en",
    "fullname":"gen-en",
    "completion":0
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

let pm = new ProjectsManager(query, config);

describe('@Importer', function () {

    describe('@UsfmImport', function () {
        it('should import a sample ufsm file', function (done) {
            var file = {
                name: "sample-usfm-file.txt",
                path: path.resolve('unit_tests/importer/data/sample-usfm-file.txt')
            };
            try{
                pm.loadTargetTranslation(translation).then(function(proj){
                    console.log("project",proj);

                    /*importer.importUSFMFile(file,proj).then(function(){


                        done()
                    }).catch(function(e){
                        console.log(e.stack);
                    });*/
                });


                /* var test = pm.loadProjectsList().then(function(data){
                    console.log("project list",data);
                });*/
                //console.log("test",test);
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
