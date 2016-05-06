'use strict';

;(function () {

    let assert = require('assert');

    function getConfigurator () {
        let Configurator = require('../../src/js/configurator').Configurator;
        let configurator = new Configurator();
        let config = require('./data/ts-config');
        configurator.setStorage({});
        configurator.loadConfig(config);
        return configurator;
    }

    describe('@Configurator', function () {
        describe('@GetStringValue', function () {
            it('should retrieve a string value', function () {
                var key = 'string',
                    expected = 'test string';
                var configurator = getConfigurator();
                assert.equal(configurator.getValue(key), expected);
            });
        });

        describe('@GetIntValue', function () {
            it('should retrieve an int value', function () {
                var key = 'int',
                    expected = 111;
                var configurator = getConfigurator();
                assert.equal(configurator.getValue(key), expected);
            });
        });

        describe('@GetBoolValue', function () {
            it('should retrieve a boolean value', function () {
                var key = 'bool',
                    expected = true;
                var configurator = getConfigurator();
                assert.equal(configurator.getValue(key), expected);
            });
        });

        describe('@SetStringValue', function () {
            it('should set a string value', function () {
                var key = 'string',
                    expected = 'test this';
                var configurator = getConfigurator();
                configurator.setValue(key, expected);
                assert.equal(configurator.getValue(key), expected);
            });
        });

        describe('@SetIntValue', function () {
            it('should set an int value', function () {
                var key = 'int',
                    expected = 222;
                var configurator = getConfigurator();
                configurator.setValue(key, expected);
                assert.equal(configurator.getValue(key), expected);
            });
        });

        describe('@SetBoolValue', function () {
            it('should set a boolean value', function () {
                var key = 'bool',
                    expected = false;
                var configurator = getConfigurator();
                configurator.setValue(key, expected);
                assert.equal(configurator.getValue(key), expected);
            });
        });

        describe('@UnsetValue', function () {
            it('should unset a value', function () {
                var key = 'new setting',
                    initial = 'test this',
                    expected = '';
                var configurator = getConfigurator();
                configurator.setValue(key, initial);
                configurator.unsetValue(key);
                assert.equal(configurator.getValue(key), expected);
            });
        });

        //the below test doesn't work right

        /*describe('@PurgeValues', function () {
            it('should purge all user-set values', function () {
                var configurator = getConfigurator();
                configurator.setValue('willpurge', 'user set');
                configurator.setValue('new setting', 'test this');
                configurator.purgeValues();
                assert.equal(configurator.getValue('willpurge'), 'this is the default');
                assert.equal(configurator.getValue('new setting'), '');
            });
        });*/
    });

})();
