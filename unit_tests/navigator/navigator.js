'use strict';

;(function () {

    let assert = require('assert');
    let rimraf = require('rimraf');
    let Configurator = require('../../app/js/configurator').Configurator;
    let Navigator = require('../../app/js/navigator').Navigator;
    let Reporter = require('../../app/js/reporter').Reporter;
    let config = require('../../app/config/defaults');

    let configurator = new Configurator();
    configurator.setStorage({});
    configurator.loadConfig(config);
    configurator.setValue('indexDir', './unit_tests/navigator/index/', {
        mutable: false
    });

    let reporter = new Reporter({
        logPath: 'unit_tests/navigator/index/log.txt',
    });
    let enableTests = false;

    GLOBAL.App = {
        configurator: configurator,
        reporter: reporter
    };

    describe('@Navigator', function () {
        this.timeout(600000); // 10 min

        before(function (done) {
            rimraf(configurator.getValue('indexDir'), function () {
                done();
            });
        });

        //TODO: we're still testing this. Part of this reason for this unit test is to provide a way to download the content to use for the default app index.
        after(function (done) {
            rimraf(configurator.getValue('indexDir'), function () {
                done();
            });
        });

        if (enableTests) {
            let navigator = new Navigator();

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
