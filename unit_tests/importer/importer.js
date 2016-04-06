'use strict';

process.env.NODE_ENV = 'test';

let fs = require('fs');
let path = require('path');
let rimraf = require('rimraf');
let assert = require('assert');
let ProjectsManager = require('../../src/js/projects').ProjectsManager;
let Importer = require('../../src/js/importer').Importer;
let Db = require('../../src/js/lib/db').Db;
let mkdirp = require('mkdirp');

let targetDir = path.resolve('./unit_tests/importer/data/tmp/projects');
let tempDir = path.resolve('./unit_tests/importer/data/tmp');

let translation = {
    "package_version": 6,
    "format": "usfm",
    "generator": {
        "name": "ts-desktop",
        "build": ""
    },
    "target_language": {
        "id": "es",
        "name": "español",
        "direction": "ltr"
    },
    "project": {
        "id": "mat",
        "name": "Matthew"
    },
    "type": {
        "id": "text",
        "name": "Text"
    },
    "resource": {
        "id": "reg",
        "name": "Regular"
    },
    "source_translations": [
        {
            "language_id": "en",
            "resource_id": "ulb",
            "checking_level": 3,
            "date_modified": 20160223,
            "version": "4",
            "project_id": "mat",
            "id": 139,
            "language_name": "English",
            "resource_name": "Unlocked Literal Bible"
        }
    ],
    "parent_draft": {},
    "translators": [],
    "finished_chunks": [],
    "currentsource": 0,
    "project_type_class": "standard",
    "unique_id": "es_mat_text_reg",
    "fullname": "mat-es",
    "completion": 0
};

let config = {
    getValue: function (k) {
        let i = {
            'targetTranslationsDir': targetDir,
            'tempDir': tempDir
        };
        return i[k];
    }
};

let user = {
    username: 'test',
    email: 'test@test.com'
};

var p = path.resolve('.'),
    srcPath = path.join(p,'src'),
    schemaPath = path.join(srcPath,'config','schema.sql'),
    dbPath = path.join(srcPath,'index','index.sqlite'),
    tempProjPath = path.join(p, 'unit_tests', 'importer', 'data', 'tmp' , 'projects', 'es_mat_text_reg'),
    projTemplatePath = path.join(p, 'unit_tests', 'importer', 'data', '_template', 'manifest.json'),
    expectedFile = path.join(tempProjPath, '28', '18.txt');

let db = new Db(schemaPath, dbPath);
let pm = new ProjectsManager(db, config, srcPath);

describe('@Importer', function () {

    describe('@UsfmImport', function () {
        it('should import a sample ufsm text file', function (done) {
            rimraf.sync(tempProjPath, fs);
            mkdirp.sync(tempProjPath);
            fs.createReadStream(projTemplatePath).pipe(fs.createWriteStream(tempProjPath + '/manifest.json'));

            var file = {
                name: "matthew.usfm",
                path: path.resolve('unit_tests/importer/data/matthew.usfm')
            };
            let importer = new Importer(config, pm);
            importer.importUSFMFile(file, translation, user).then(function(){
                var data = fs.readFileSync(expectedFile, {encoding: 'utf-8'});
                assert.equal(data, '\\v18 Jesus veio para eles e falou, "Toda autoridade foi dada para mim no céu e na terra. \\v19 Por isso vão e façam discípulos de todas as nações. Batize-os no nome do Pai, do Filho e do Espírito Santo.    ');
            }).then(done, done);

        });

        it('should import a sample ufsm zip file', function (done) {
            rimraf.sync(tempProjPath, fs);
            mkdirp.sync(tempProjPath);
            fs.createReadStream(projTemplatePath).pipe(fs.createWriteStream(tempProjPath + '/manifest.json'));

            var file = {
                name: "matthew.zip",
                path: path.resolve('unit_tests/importer/data/matthew.zip')
            };
            let importer = new Importer(config, pm);
            importer.importUSFMFile(file, translation, user).then(function(){
                var data = fs.readFileSync(expectedFile, {encoding: 'utf-8'});
                assert.equal(data, '\\v18 Jesus veio para eles e falou, "Toda autoridade foi dada para mim no céu e na terra. \\v19 Por isso vão e façam discípulos de todas as nações. Batize-os no nome do Pai, do Filho e do Espírito Santo.    ');
            }).then(done, done);

        });

        it('should import a bad ufsm text file', function (done) {
            rimraf.sync(tempProjPath, fs);
            mkdirp.sync(tempProjPath);
            fs.createReadStream(projTemplatePath).pipe(fs.createWriteStream(tempProjPath + '/manifest.json'));

            var file = {
                name: "failing_file.usfm",
                path: path.resolve('unit_tests/importer/data/failing_file.usfm')
            };
            let importer = new Importer(config, pm);
            importer.importUSFMFile(file, translation, user).then(function(){
                assert.equal(1,2);
            }).catch(function(e){
                assert.equal('This is not a valid USFM file.',e.message);
                done();
            });

        });

    });

    //cleanup
    after(function (done) {
        done();
    });

});
