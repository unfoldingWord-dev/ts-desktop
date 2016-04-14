'use strict';

process.env.NODE_ENV = 'test';

let fs = require('fs');
let path = require('path');
let rimraf = require('rimraf');
let assert = require('assert');
let ProjectsManager = require('../../src/js/projects').ProjectsManager;
let Importer = require('../../src/js/importer').Importer;
let Reporter = require('../../src/js/reporter').Reporter;
let Configurator = require('../../src/js/configurator').Configurator;
let DataManager = require('../../src/js/database').DataManager;
let GitManager = require('../../src/js/git').GitManager;
let MigrateManager = require('../../src/js/migrator').MigrateManager;
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

let configurator = new Configurator();

let user = {
    username: 'test',
    email: 'test@test.com'
};

var p = path.resolve('.'),
    tempProjPath = path.join(p, 'unit_tests', 'importer', 'data', 'tmp' , 'projects', 'es_mat_text_reg'),
    projTemplatePath = path.join(p, 'unit_tests', 'importer', 'data', '_template', 'manifest.json'),
    expectedFile = path.join(tempProjPath, '28', '18.txt');

configurator.setValue('targetTranslationsDir',targetDir);
configurator.setValue('tempDir',tempDir);

let reporter = new Reporter({
    logPath: path.join(configurator.getValue('rootDir'), 'log.txt'),
    oauthToken: configurator.getValue('github-oauth'),
    repoOwner: configurator.getValue('repoOwner'),
    repo: configurator.getValue('repo'),
    maxLogFileKb: configurator.getValue('maxLogFileKb'),
    appVersion: require('../../package.json').version
});

let dataManager = (function () {
    // TODO: should we move the location of these files/folders outside of the src folder?
    var srcDir = path.resolve(path.join(__dirname, '../../src/')),
        schemaPath = path.join(srcDir, 'config', 'schema.sql'),
        dbPath = path.join(srcDir, 'index', 'index.sqlite'),
        db = new Db(schemaPath, dbPath);

    return new DataManager(db);
})();

let gitManager = (function () {
    return new GitManager();
})();

let migrateManager = (function () {
    return new MigrateManager(configurator);
})();

let pm = (function () {
    return new ProjectsManager(dataManager, configurator, reporter, gitManager, migrateManager);
})();

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
            let importer = new Importer(configurator, pm);
            importer.importUSFMFile(file, translation, user).then(function(){
                var data = fs.readFileSync(expectedFile, {encoding: 'utf-8'});
                assert.equal(data, ' Jesus veio para eles e falou, "Toda autoridade foi dada para mim no céu e na terra.  Por isso vão e façam discípulos de todas as nações. Batize-os no nome do Pai, do Filho e do Espírito Santo.    ');
            }).then(done, done).catch(function(e){
                console.log('ERROR: ', e);
            });

        });

        /*it('should import a sample ufsm zip file', function (done) {
            rimraf.sync(tempProjPath, fs);
            mkdirp.sync(tempProjPath);
            fs.createReadStream(projTemplatePath).pipe(fs.createWriteStream(tempProjPath + '/manifest.json'));

            var file = {
                name: "matthew.zip",
                path: path.resolve('unit_tests/importer/data/matthew.zip')
            };
            let importer = new Importer(configurator, pm);
            importer.importUSFMFile(file, translation, user).then(function(){
                var data = fs.readFileSync(expectedFile, {encoding: 'utf-8'});
                assert.equal(data, ' Jesus veio para eles e falou, "Toda autoridade foi dada para mim no céu e na terra.  Por isso vão e façam discípulos de todas as nações. Batize-os no nome do Pai, do Filho e do Espírito Santo.    ');
            }).then(done, done);

        });*/

        it('should import a bad ufsm text file', function (done) {
            rimraf.sync(tempProjPath, fs);
            mkdirp.sync(tempProjPath);
            fs.createReadStream(projTemplatePath).pipe(fs.createWriteStream(tempProjPath + '/manifest.json'));

            var file = {
                name: "failing_file.usfm",
                path: path.resolve('unit_tests/importer/data/failing_file.usfm')
            };
            let importer = new Importer(configurator, pm);
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
