/**
 * Created by Chris on 7/27/2015.
 */

var assert = require('assert');
var fs = require('fs');
var User = require('../../app/js/user');
var jsonfile = require('jsonfile');
var md5 = require('md5');

var profilesDirectory = 'unit_tests/user/data/';
var username0 = '';
var username1 = 'testuser1';
var username2 = 'testuser2';
var password = 'testpass';
var hash1 = md5(username1);
var hash2 = md5(username2);
var targetDirectory1 = 'translationStudio/profiles/' + hash1 + '/';
var targetDirectory2 = 'translationStudio/profiles/' + hash2 + '/';
var targetFile1 = profilesDirectory + targetDirectory1 + 'profile.json';
var targetFile2 = profilesDirectory + targetDirectory2 + 'profile.json';
var user0;
var user1;
var user2;

describe('@User', function() {
    describe('@CheckFiles', function() {
        before(function (done) {
            fs.unlink(targetFile1, function() {
                done();
            });
        });

        describe('@NoFile', function () {
            var fileTest = null;
            before(function (done) {
                jsonfile.readFile(targetFile1, function (err) {
                    if (err === null) {
                        fileTest = "File";
                    } else {
                        fileTest = "NoFile";
                    }
                    done();
                });
            });
            it('should confirm profile does not exist for new user1', function () {
                var expected = "NoFile";
                assert.equal(fileTest, expected);
            });
        });

        describe('@File', function () {
            var fileTest = null;
            before(function (done) {
                jsonfile.readFile(targetFile2, function (err) {
                    if (err === null) {
                        fileTest = "File";
                    } else {
                        fileTest = "NoFile";
                    }
                    done();
                });
            });
            it('should confirm profile does exist for existing user2', function () {
                var expected = "File";
                assert.equal(fileTest, expected);
            });
        });
    });

    describe('@BlankUser', function() {
        var emessage = "No error";
        before(function (done) {
            try {
                user0 = new User.instance({
                    profilesDirectory: profilesDirectory,
                    username: username0,
                    password: password
                });
            } catch (e) {
                emessage = e.message;
            }
            done();
        });
        it('should create an error for a blank username', function () {
            var expected = "Must supply a valid username";
            assert.equal(emessage, expected);
        });
    });

    describe('@NewUser', function() {
        var create = null;
        before(function (done) {
            user1 = new User.instance({
                profilesDirectory: profilesDirectory,
                username: username1,
                password: password
            });
            create = "Created";
            done();
        });

        describe('@CreateFile', function () {
            it('should create profile for new user1', function () {
                var expected = "Created";
                assert.equal(create, expected);
            });
        });

        describe('@GetName', function () {
            it('should retrieve blank name', function () {
                var expected = '';
                assert.equal(user1.getName(), expected);
            })
        });

        describe('@GetEmail', function () {
            it('should retrieve blank email', function () {
                var expected = '';
                assert.equal(user1.getEmail(), expected);
            })
        });

        describe('@GetPhone', function () {
            it('should retrieve blank phone', function () {
                var expected = '';
                assert.equal(user1.getPhone(), expected);
            })
        });

        describe('@SetName', function () {
            it('should set name', function () {
                var name = 'New User',
                    expected = 'New User';
                user1.setName(name);
                assert.equal(user1.getName(), expected);
            })
        });

        describe('@SetEmail', function () {
            it('should set email', function () {
                var email = 'user1@example.com',
                    expected = 'user1@example.com';
                user1.setEmail(email);
                assert.equal(user1.getEmail(), expected);
            })
        });

        describe('@SetPhone', function () {
            it('should set phone', function () {
                var phone = '503-555-1111',
                    expected = '503-555-1111';
                user1.setPhone(phone);
                assert.equal(user1.getPhone(), expected);
            })
        });

        describe('@Commit', function () {
            it('should save storage into file', function () {
                var expected = true;
                assert.equal(user1.commit(), expected);
            })
        });
    });

    describe('@ExistingUser', function() {
        var update = null;
        before(function (done) {
            user2 = new User.instance({
                profilesDirectory: profilesDirectory,
                username: username2,
                password: password
            });
            update = "Updated";
            done();
        });

        describe('@UpdateFile', function () {
            it('should update profile for existing user2', function () {
                var expected = "Updated";
                assert.equal(update, expected);
            });
        });

        describe('@GetName', function () {
            it('should retrieve stored name', function () {
                var expected = 'Existing User';
                assert.equal(user2.getName(), expected);
            })
        });

        describe('@GetEmail', function () {
            it('should retrieve stored email', function () {
                var expected = 'user2@example.com';
                assert.equal(user2.getEmail(), expected);
            })
        });

        describe('@GetPhone', function () {
            it('should retrieve stored phone', function () {
                var expected = '503-555-2222';
                assert.equal(user2.getPhone(), expected);
            })
        });
    });

});
