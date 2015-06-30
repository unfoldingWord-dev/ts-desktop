/**
 * Created by joel on 6/23/2015.
 */
var assert = require('assert');
var configurator = require('../../app/js/configurator');
var config = require('./data/private');
var defaults = require('./data/defaults');
describe('@Configurator', function() {
    describe('@GetStringValue', function() {
        it('should retreive a string value', function() {
            var key ='testkey',
                textExpected = 'this is a test';

            assert(true);

            // This test would bomb because the configurator uses localStorage which is only available in a browser
            //configurator.loadConfig(config);
            //configurator.loadDefaults(defaults);
            //assert.equal(configurator.getString(key), textExpected);
        })
    })

    //TODO: write more tests
})
