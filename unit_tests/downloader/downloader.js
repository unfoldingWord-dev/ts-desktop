var assert = require('assert');
var Indexer = require('../../app/js/indexer').Indexer;
var testIndexer = new Indexer('test');
var Downloader = require('../../app/js/downloader').Downloader;
var downloader = new Downloader({}, testIndexer);

;(function () {
    'use strict';

    describe('@Downloader', function () {

        describe('@DownloadProjectList', function () {
            it('should retrieve the current project catalog', function () {
                let result = downloader.downloadProjectList();
                let projects = testIndexer.getProjects();
                assert.equal(result, true);
                assert.equal(projects.length>0, true);
            });
        });

    });
})();
