/**
 * Created by Emmitt on 7/24/2015.
 */

var assert = require('assert');
var uploader = require('../../app/js/uploader');

;(function () {
    'use strict';

    describe('@Uploader', function () {

        after(function () {
            uploader.disconnect();
        });

        describe('@setPort', function () {
            it('should set the host of the uploader', function () {
                var key =  'ts.door43.org';
                uploader.setHost(key);
                var results = uploader.getServerInfo().host;
                assert.equal(results, key);
            });
        });

        describe('@setPort', function () {
            it('should set the port of the uploader', function () {
                var key =  '9095';
                uploader.setPort(key);
                var results = uploader.getServerInfo().port;
                assert.equal(results, key);
            });
        });

        describe('@connect', function () {
            it('should attempt to connect to the server', function () {
                var key =  'done';
                uploader.connect(function (data) {
                    if (data.error) {
                        assert.fail(true, false, data.error);
                    } else {
                        assert.equal(data.ok, key);
                    }
                });
            });
        });

        describe('@setServerInfo', function () {
            it('should set the port and host at the same time', function () {
                var host =  'hello';
                var port =  '101';
                uploader.setServerInfo({'host': host, 'port': port});
                var results = uploader.getServerInfo();
                assert.equal(results.port, port);
                assert.equal(results.host, host);
            });
        });
    });

})();
