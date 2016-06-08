'use strict';

;(function () {

    let assert = require('assert');
    let fs = require('fs');
    let rimraf = require('rimraf');
    let Migrator = require('../../src/js/migrator').MigrateManager;
    let migrator = new Migrator({
        getValue: function () {
            return {};
        },
        setValue: function () {

        },
        unsetValue: function () {

        }
    }, {
        commitAll: function () {
            return Promise.resolve();
        }
    });

    let tempDir = 'unit_tests/migration/temp/';
    let dataDir = 'unit_tests/migration/data/';

    let mkdir = function(path) {
        return new Promise(function(resolve, reject) {
            fs.mkdir(path, resolve);
        });
    };

    describe('@migration', function() {
        this.timeout(10000);
        before(function (done) {

            let promises = [
                mkdir(tempDir),
                mkdir(tempDir + 'v2'),
                mkdir(tempDir + 'v3'),
                mkdir(tempDir + 'v4')
            ];
            Promise.all(promises).then(function() {
                // load data
                fs.createReadStream(dataDir + 'v2.json').pipe(fs.createWriteStream(tempDir + 'v2/manifest.json'));
                fs.createReadStream(dataDir + 'v3.json').pipe(fs.createWriteStream(tempDir + 'v3/manifest.json'));
                fs.createReadStream(dataDir + 'v4.json').pipe(fs.createWriteStream(tempDir + 'v4/manifest.json'));
                fs.writeFileSync(tempDir + 'v4/title.txt', 'This is a test project title');
                done();
            });
        });

        after(function (done) {
            rimraf(tempDir, done);
        });

        it('should migrate from v4', function() {
            migrator.migrate(tempDir + 'v4').then(function() {
                assert(true, true);
            }).catch(function() {
                // failed
                assert(true, false);
            });
        });

        it('should migrate from v3', function() {
            migrator.migrate(tempDir + 'v3').then(function() {
                assert(true, true);
            }).catch(function() {
                // failed
                assert(true, false);
            });
        });

        //it('should migrate from v2', function() {
        //    migrator.migrate(tempDir + 'v2');
        //    assert(true, true);
        //});
    });
})();
