'use strict';

;(function () {

    let assert = require('assert');
    let uploader = require('../../app/js/uploader');

    describe('@Uploader', function () {

        after(function () {
            uploader.disconnect();
        });

        describe('@setPort', function () {
            it('should set the host of the uploader', function () {
                let key =  'ts.door43.org';
                uploader.setHost(key);
                let results = uploader.getServerInfo().host;
                assert.equal(results, key);
            });
        });

        describe('@setPort', function () {
            it('should set the port of the uploader', function () {
                let key =  '9095';
                uploader.setPort(key);
                let results = uploader.getServerInfo().port;
                assert.equal(results, key);
            });
        });

        describe('@connect', function () {
            it('should attempt to connect to the server', function () {
                let key =  'done';
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
                let host =  'hello';
                let port =  '101';
                uploader.setServerInfo({'host': host, 'port': port});
                let results = uploader.getServerInfo();
                assert.equal(results.port, port);
                assert.equal(results.host, host);
            });
        });
    });

})();
