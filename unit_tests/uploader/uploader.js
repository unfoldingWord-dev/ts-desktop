/**
 * Created by Emmitt on 7/24/2015.
 */
'use strict';
;(function () {

    let assert = require('assert');
    let Uploader = require('../../app/js/uploader').Uploader;
    let uploader = new Uploader();
    let User = require('../../app/js/user').User;

    describe('@Uploader', function () {
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
