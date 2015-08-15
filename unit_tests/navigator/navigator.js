var assert = require('assert');
var rimraf = require('rimraf');
var Configurator = require('../../app/js/configurator').Configurator;
var Navigator = require('../../app/js/navigator').Navigator;
var Reporter = require('../../app/js/reporter').Reporter;
var config = require('../../app/config/defaults');

var configurator = new Configurator();
configurator.setStorage({});
configurator.loadConfig(config);
configurator.setValue('indexDir', './unit_tests/navigator/index/', {
    mutable: false
});

var reporter = new Reporter({
    logPath: 'unit_tests/navigator/index/log.txt',
});

GLOBAL.App = {
    configurator: configurator,
    reporter: reporter
};

;(function () {
    'use strict';

    let navigator = new Navigator();

    describe('@Navigator', function () {

        before(function (done) {
            rimraf(configurator.getValue('indexDir'), function () {
                done();
            });
        });

        // TODO: we're still testing this. Part of this reason for this unit test is to provide a way to download the content to use for the default app index.
        after(function (done) {
            rimraf(configurator.getValue('indexDir'), function () {
                done();
            });
        });

        describe('@GetServerLibraryIndex', function () {
            let index = {};
            let updates = {};
            before(function (done) {
                navigator.getServerLibraryIndex(function(serverIndex, availableUpdates) {
                    index = serverIndex;
                    updates = availableUpdates;
                   done();
                });
            });
            it('should download and return the server library index', function () {
                // TODO: finish setting up these asserts
                assert.equal(true, true);
                //assert.equal(index, 'test');
                //assert.equal(updates, 'test');
            });
        });
    });
})();
