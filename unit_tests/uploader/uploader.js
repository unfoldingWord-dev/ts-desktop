/**
 * Created by Emmitt on 7/24/2015.
 */
'use strict';
;(function () {

    let assert = require('assert'),
        path = require('path'),
        rimraf = require('rimraf'),
        Uploader = require('../../app/js/uploader').Uploader,
        uploader = new Uploader(),
        User = require('../../app/js/user').User;

    uploader.sshPath = path.resolve('unit_tests/uploader/ssh');

    describe('@Uploader', function () {

        after(function (done) {
            rimraf(uploader.sshPath, done);
        });

        describe('@register', function () {
            this.timeout(20000);

            it('should register the keys with the server', function (done) {
                uploader.register({ deviceID: 'uploaderUnitTest' }).then(function (reg) {
                    assert(!!reg.response, 'expected a response object');
                    assert(!!reg.keys, 'expected keys');
                    assert(!!reg.keys.public, 'expected public key to be generated');
                    assert(!!reg.keys.private, 'expected private key to be generated');

                    var response = JSON.stringify(reg.response);

                    assert(!!reg.response.ok, 'expected an "ok" response but got ' + response);
                    assert(!reg.response.error, 'did not expect an error response but got ' + response);
                    done();
                }).catch(function (err) {
                    done(new Error(err));
                });
            });
        });

        // TODO: this is broken
        //describe('@register', function () {
        //    this.timeout(10000);
        //    it('should register with the server', function (done) {
        //        var key =  'done';
        //        var deviceID = 'uploaderUnitTest';
        //        uploader.register('ts.door43.org', 9095, deviceID, function (data) {
        //            if (data.error) {
        //                if (data.error === 'duplicate username') {
        //                    assert.ok(true, data.error);
        //                    done();
        //                } else {
        //                    assert.fail(true, false, data.error);
        //                    done();
        //                }
        //            } else {
        //                assert.equal(data.ok, key);
        //                done();
        //            }
        //        });
        //    });
        //});
        describe('@verifyProfile', function () {
            it('should make sure a profile has a name and email', function () {
                var user = new User({
                    profilesDirectory: 'unit_tests/user/data/',
                    username: 'username',
                    password: 'password'
                });
                user.setEmail('test@example.com');
                user.setName('Tester');
                var returned = uploader.verifyProfile(user);
                assert.equal(returned, true);
            });
        });
    });
})();
