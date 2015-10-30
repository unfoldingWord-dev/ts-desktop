'use strict';

;(function () {
    /** /
    let assert = require('assert');
    let rimraf = require('rimraf');
    let Indexer = require('../../app/js/indexer').Indexer;
    let Downloader = require('../../app/js/downloader').Downloader;
    let Configurator = require('../../app/js/configurator').Configurator;
    let config = require('../../app/config/defaults');

    let configurator = new Configurator();
    configurator.setStorage({});
    configurator.loadConfig(config);
    let indexConfig = {
        indexDir: './unit_tests/downloader/index/',
        apiUrl: configurator.getValue('apiUrl')
    };
    let downloadIndex = new Indexer('download', indexConfig);
    let downloader = new Downloader(downloadIndex, {
        apiUrl: indexConfig.apiUrl
    });

    describe('@Downloader', function () {

        this.timeout(60000); // 1 min

        before(function (done) {
            rimraf(indexConfig.indexDir, function () {
                done();
            });
        });

        after(function (done) {
            rimraf(indexConfig.indexDir, function () {
                done();
            });
        });

        describe('@DownloadProjectList', function () {
            let downloadSucceded = false;
            before(function (done) {
                let promise = downloader.downloadProjectList();
                promise.then(function () {
                    downloadSucceded = true;
                    done();
                });
                promise.catch(function () {
                    downloadSucceded = false;
                    done();
                });
            });

            it('should download the latest projects from the server', function () {
                assert.equal(downloadSucceded, true);
                var projects = downloadIndex.getProjects();
                assert.equal(projects.length > 0, true);
            });
        });

        describe('@DownloadSourceLanguageList', function () {
            let downloadSucceded = false;
            let projectId = -1;
            before(function (done) {
                projectId = downloadIndex.getProjects()[0];
                let promise = downloader.downloadSourceLanguageList(projectId);
                promise.then(function () {
                    downloadSucceded = true;
                    done();
                });
                promise.catch(function () {
                    downloadSucceded = false;
                    done();
                });
            });

            it('should download the latest source languages from the server', function () {
                assert.equal(downloadSucceded, true);
                var sourceLanguages = downloadIndex.getSourceLanguages(projectId);
                assert.equal(sourceLanguages.length > 0, true);
            });
        });

        describe('@DownloadResourceList', function () {
            let downloadSucceded = false;
            let projectId = -1;
            let sourceLanguageId = -1;
            before(function (done) {
                projectId = downloadIndex.getProjects()[0];
                sourceLanguageId = downloadIndex.getSourceLanguages(projectId)[0];
                let promise = downloader.downloadResourceList(projectId, sourceLanguageId);
                promise.then(function () {
                    downloadSucceded = true;
                    done();
                });
                promise.catch(function () {
                    downloadSucceded = false;
                    done();
                });
            });

            it('should download the latest resources from the server', function () {
                assert.equal(downloadSucceded, true);
                var resources = downloadIndex.getResources(projectId, sourceLanguageId);
                assert.equal(resources.length > 0, true);
            });
        });
    });
    /**/
})();
