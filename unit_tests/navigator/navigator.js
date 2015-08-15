var assert = require('assert');
var rimraf = require('rimraf');
var Configurator = require('../../app/js/configurator').Configurator;
var configurator = new Configurator();
var Navigator = require('../../app/js/navigator').Navigator;
var config = require('../../app/config/defaults');

configurator.setStorage({});
configurator.loadConfig(config);
configurator.setValue('indexDir', './unit_tests/navigator/index/', {
    mutable: false
});
GLOBAL.App = {
    configurator: configurator
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

        //after(function (done) {
        //    rimraf(configurator.getValue('indexDir'), function () {
        //        done();
        //    });
        //});

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
                assert.equal(index, 'test');
                assert.equal(updates, 'test');
            });
        });
    });
})();
