/**
 * Created by Emmitt on 7/24/2015.
 */

var assert = require('assert');
var uploader = require('../../app/js/uploader');
var User = require('../../app/js/user');

;(function () {
    'use strict';

    describe('@Uploader', function () {
        after(function (done) {
            uploader.disconnect();
            done();
        });
        describe('@register', function () {
            it('should register with the server', function (done) {
                var key =  'done';
                uploader.register('ts.door43.org', 9095, 'Random', function (data) {
                    if (data.error) {
                        assert.fail(true, false, data.error);
                        done();
                    } else {
                        assert.equal(data.ok, key);
                        done();
                    }
                });
            });
        });
        describe('@verifyProfile', function () {
            it('should make sure a profile has a name and email', function () {
                var user = new User.instance({
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
