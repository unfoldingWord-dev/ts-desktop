'use strict';

let assert = require('assert');
let Indexer = require('../../app/js/indexer').Indexer;
let Downloader = require('../../app/js/downloader').Downloader;
let rimraf = require('rimraf');
let Configurator = require('../../app/js/configurator').Configurator;
let config = require('../../app/config/defaults');

let configurator = new Configurator();
configurator.setStorage({});
configurator.loadConfig(config);
let indexConfig = {
    indexDir: './unit_tests/downloader/index/',
    apiUrl: configurator.getValue('apiUrl')
};
let appIndex = new Indexer('app', indexConfig);
let downloadIndex = new Indexer('download', indexConfig);
let downloader = new Downloader({
    apiUrl: indexConfig.apiUrl
}, downloadIndex, appIndex);

;(function () {

    describe('@Downloader', function () {

        before(function(done) {
            rimraf(indexConfig.indexDir, function () {
                done();
            });
        });

        after(function(done) {
            rimraf(indexConfig.indexDir, function () {
                done();
            });
        });

        describe('@DownloadProjectList', function () {
            let downloadSucceded = false;
            before(function(done) {
                downloader.downloadProjectList(function(success) {
                    downloadSucceded = success;
                    done();
                });
            });

            it('should download the latest projects from the server', function () {
                assert.equal(downloadSucceded, true);
                var projects = downloadIndex.getProjects();
                assert.equal(projects.length>0, true);
            });
        });

    });
})();
