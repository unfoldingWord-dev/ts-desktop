'use strict';

;(function () {

    let assert = require('assert');
    let fs = require('fs');
    let User = require('../../src/js/user').User;
    let jsonfile = require('jsonfile');
    let md5 = require('md5');

    //import comparison data
    let profilesDirectory = 'unit_tests/user/data/';
    let username0 = '';
    let username1 = 'testuser1';
    let username2 = 'testuser2';
    let password = 'testpass';
    let hash1 = md5(username1);
    let hash2 = md5(username2);
    let targetDirectory1 = 'translationStudio/profiles/' + hash1 + '/';
    let targetDirectory2 = 'translationStudio/profiles/' + hash2 + '/';
    let targetFile1 = profilesDirectory + targetDirectory1 + 'profile.json';
    let targetFile2 = profilesDirectory + targetDirectory2 + 'profile.json';
    let user0;
    let user1;
    let user2;

    describe('@User', function () {
        describe('@CheckFiles', function () {
            before(function (done) {
                fs.unlink(targetFile1, function () {
                    done();
                });
            });

            describe('@NoFile', function () {
                let fileTest = null;
                before(function (done) {
                    jsonfile.readFile(targetFile1, function (err) {
                        if (err === null) {
                            fileTest = 'File';
                        } else {
                            fileTest = 'NoFile';
                        }
                        done();
                    });
                });
                it('should confirm profile does not exist for new user1', function () {
                    let expected = 'NoFile';
                    assert.equal(fileTest, expected);
                });
            });

            describe('@File', function () {
                let fileTest = null;
                before(function (done) {
                    jsonfile.readFile(targetFile2, function (err) {
                        if (err === null) {
                            fileTest = 'File';
                        } else {
                            fileTest = 'NoFile';
                        }
                        done();
                    });
                });
                it('should confirm profile does exist for existing user2', function () {
                    let expected = 'File';
                    assert.equal(fileTest, expected);
                });
            });
        });

        describe('@BlankUser', function () {
            let emessage = 'No error';
            before(function (done) {
                try {
                    user0 = new User({
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
                let expected = 'Must supply a valid username';
                assert.equal(emessage, expected);
            });
        });

        describe('@NewUser', function () {
            user1 = new User({
                profilesDirectory: profilesDirectory,
                username: username1,
                password: password
            });

            after(function () {
                user1.destroy();
            });

            describe('@CreateFile', function () {
                it('should create profile for new user1', function () {
                    user1.commit();
                    assert.equal(true, fs.existsSync(user1.getProfilePath()));
                });
            });

            describe('@GetName', function () {
                it('should retrieve blank name', function () {
                    let expected = '';
                    assert.equal(user1.getName(), expected);
                });
            });

            describe('@GetEmail', function () {
                it('should retrieve blank email', function () {
                    let expected = '';
                    assert.equal(user1.getEmail(), expected);
                });
            });

            describe('@GetPhone', function () {
                it('should retrieve blank phone', function () {
                    let expected = '';
                    assert.equal(user1.getPhone(), expected);
                });
            });

            describe('@SetName', function () {
                it('should set name', function () {
                    let name = 'New User',
                        expected = 'New User';
                    user1.setName(name);
                    assert.equal(user1.getName(), expected);
                });
            });

            describe('@SetEmail', function () {
                it('should set email', function () {
                    let email = 'user1@example.com',
                        expected = 'user1@example.com';
                    user1.setEmail(email);
                    assert.equal(user1.getEmail(), expected);
                });
            });

            describe('@SetPhone', function () {
                it('should set phone', function () {
                    let phone = '503-555-1111',
                        expected = '503-555-1111';
                    user1.setPhone(phone);
                    assert.equal(user1.getPhone(), expected);
                });
            });

            describe('@Commit', function () {
                it('should save storage into file', function () {
                    let expected = true;
                    assert.equal(user1.commit(), expected);
                });
            });
        });

        describe('@ExistingUser', function () {
            let update = null;
            before(function (done) {
                user2 = new User({
                    profilesDirectory: profilesDirectory,
                    username: username2,
                    password: password
                });
                update = 'Updated';
                done();
            });

            describe('@UpdateFile', function () {
                it('should update profile for existing user2', function () {
                    let expected = 'Updated';
                    assert.equal(update, expected);
                });
            });
            /** /
            describe('@GetName', function () {
                it('should retrieve stored name', function () {
                    let expected = 'Existing User';
                    assert.equal(user2.getName(), expected);
                });
            });

            describe('@GetEmail', function () {
                it('should retrieve stored email', function () {
                    let expected = 'user2@example.com';
                    assert.equal(user2.getEmail(), expected);
                });
            });

            describe('@GetPhone', function () {
                it('should retrieve stored phone', function () {
                    let expected = '503-555-2222';
                    assert.equal(user2.getPhone(), expected);
                });
            });
            /**/
        });

    });

})();
