/**
 * Created by joel on 6/23/2015.
 */
var assert = require('assert');
var configurator = require('../../app/js/configurator');
var config = require('./data/config');
describe('@Configurator', function() {
    describe('@GetStringValue', function() {
        it('should retreive a string value', function() {
            var key ='testKey',
                textExpected = '';
            configurator.loadConfig(config);
            assert.equal(configurator.getString(key), textExpected);
        })
    })

    //TODO: write more tests
})
