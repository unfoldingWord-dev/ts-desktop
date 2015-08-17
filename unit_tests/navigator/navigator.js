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
var enableTests = false;

(function () {
    'use strict';

    let navigator = new Navigator();

    describe('@Navigator', function () {
        this.timeout(600000); // 10 min

        //before(function (done) {
        //    rimraf(configurator.getValue('indexDir'), function () {
        //        done();
        //    });
        //});

        // TODO: we're still testing this. Part of this reason for this unit test is to provide a way to download the content to use for the default app index.
        //after(function (done) {
        //    rimraf(configurator.getValue('indexDir'), function () {
        //        done();
        //    });
        //});

        if (enableTests) {
            describe('@GetServerLibraryIndex', function () {
                navigator = navigator; // TODO: remove this after we use it
                let index = null;
                let updates = null;
                before(function (done) {
                    let promise = navigator.getServerLibraryIndex();
                    promise.then(function (serverIndex, availableUpdates) {
                        index = serverIndex;
                        updates = availableUpdates;
                        done();
                    });
                    promise.catch(function () {
                        done();
                    });
                });
                it('should download and return the server library index', function () {
                    // TODO: finish setting up these asserts
                    assert.notEqual(index, null);
                    assert.notEqual(updates, null);
                });
            });
        }
    });
})();
