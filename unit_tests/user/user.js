/**
 * Created by Chris on 7/27/2015.
 */
var assert = require('assert');

var User = require('../../app/js/user');

var user = new User.instance({
    profilesDirectory: 'unit_tests/user/data/',
    username: 'testuser',
    password: 'testpass'
});

describe('@User', function() {
    describe('@SetName', function () {
        it('should set and retrieve name', function () {
            var name = 'My Name',
                expected = 'My Name';
            user.setName(name);
            assert.equal(user.getName(), expected);
        })
    });

    describe('@SetEmail', function () {
        it('should set and retrieve email', function () {
            var email = 'user@example.com',
                expected = 'user@example.com';
            user.setEmail(email);
            assert.equal(user.getEmail(), expected);
        })
    });

    describe('@SetPhone', function () {
        it('should set and retrieve phone', function () {
            var phone = '503-555-1000',
                expected = '503-555-1000';
            user.setPhone(phone);
            assert.equal(user.getPhone(), expected);
        })
    });

    describe('@Commit', function () {
        it('should save storage into file', function () {
            var expected = true;
            assert.equal(user.commit(), expected);
        })
    });

})
