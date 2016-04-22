'use strict';

process.env.NODE_ENV = 'test';

let assert = require('assert');
// let rimraf = require('rimraf');
// let path = require('path');
// let mkdirp = require('mkdirp');
// let Uploader = require('../../src/js/uploader').Uploader;
// let fs = require('fs');
// let _ = require('lodash');
let Git = require('../../src/js/git');
let Gogs = require('gogs-client');

var config = {};
try {
    config = require('./config');
} catch (e) {
    console.log('Please provide ./unit_tests/git/config.json to run git tests');
    return;
}
if(typeof Git !== 'function') {
	console.log('Git could not be found. Tests will not be ran');
	return;
}
let git = new Git({
    token: config.token
});
let newUser = config.newUser;
let createdUser = null;


// TRICKY: for some reason nodegit does not play nice.
// So you must comment out the nodegit require in the git module when running these tests

//
//uploader.sshPath = path.resolve('unit_tests/git/ssh');
//
describe('@Git', function () {
   this.timeout(6000);



//
//    let repoDir = path.resolve('unit_tests/git/testrepo'),
//        testFileName = 'sample.txt',
//        testFile = path.join(repoDir, testFileName),
//        repo = 'uw-unittest-en';
//
//    function createDummyProject (cb) {
//        rimraf(repoDir, function (err) {
//            if (err) {
//                cb(err);
//            } else {
//                mkdirp(repoDir, function (err) {
//                    if (err) {
//                        cb(err);
//                    } else {
//                        fs.writeFile(testFile, 'A line of text', function () {
//                            cb();
//                        });
//                    }
//                });
//            }
//        });
//    }
//
//    function initRepo (cb) {
//        createDummyProject(function (err) {
//            if (err) {
//                cb(err);
//            } else {
//                return git.init(repoDir).then(function (ret) {
//                    cb();
//                    return ret;
//                }, cb);
//            }
//        })
//    }
//
//    function deleteProject (cb) {
//        rimraf(repoDir, cb);
//    }

    before(function(done) {
        git.deleteAccount(newUser).then(done, function() {
            done();
        });
    });
    after(function(done) {
        git.deleteAccount(newUser).then(done, function() {
            done();
        });
    });

    describe('@CreateAccount', function() {
        it('should create a new gogs account', function(done) {
            git.createAccount(newUser).then(function(user) {
                createdUser = user;
                assert(true);
            }).then(done, done);
        });
    });

    describe('@Login', function() {
       it('should log in with the user credentials', function(done) {
           git.login(newUser).then(function(user) {
               assert(true);
           }).then(done, done);
       });
    });

    describe('@DeleteAccount', function() {
        it('should delete the user account', function(done) {
            git.deleteAccount(createdUser).then(function() {
                assert(true);
            }).then(done, done);
        });
    });

//    describe('@GitBasic', function () {
//
//        before(createDummyProject);
//        after(deleteProject);
//
//        it('should init a local git repo', function (done) {
//            git.init(repoDir).then(function () {
//                fs.readdir(repoDir, function (err, files) {
//                    if (err) {
//                        done(err);
//                    } else {
//                        assert(_.includes(files, '.git'), 'expected a .git folder');
//                        done();
//                    }
//                });
//            }, done);
//        });
//    });
//
//    describe('@GitLocal', function () {
//
//        before(initRepo);
//        after(deleteProject);
//
//        it('should stage the files', function (done) {
//            git.stage(repoDir).then(function () {
//                fs.readFile(path.join(repoDir, '.git', 'index'), function (err, data) {
//                    if (err) {
//                        done(err);
//                    } else {
//                        assert(!!data.toString().match(new RegExp(testFileName)), testFileName + ' should be in the git index');
//                        done();
//                    }
//                });
//            }, done);
//        });
//    });
//
//    describe('@GitRemote', function () {
//
//        before(function (done) {
//            rimraf(repoDir, function (err) {
//                mkdirp(repoDir, function (err) {
//                    fs.writeFile(testFile, 'A line of text', function () {
//                        git.init(repoDir).then(function () {
//                            return git.stage(repoDir);
//                        }).then(function (ret) {
//                            done();
//                        });
//                    });
//                });
//            });
//        });
//
//        after(function (done) {
//            rimraf(uploader.sshPath, function () {
//                rimraf(repoDir, function () {
//                    done();
//                });
//            });
//        });
//
//        describe('@GitPush', function () {
//
//            it('should push to the server', function (done) {
//                var gitPush = git.push.bind(git, repoDir, repo);
//
//                uploader.register({ deviceId: 'gitUnitTest' }).then(gitPush).then(function (ret) {
//                    var success = ret.stdout.indexOf('Branch master set up to track') !== -1;
//
//                    assert(success, 'expected a good git push response');
//                    done();
//                }).catch(function (err) {
//                    done(new Error(err.stderr || err));
//                });
//            });
//        });
//    });
});
