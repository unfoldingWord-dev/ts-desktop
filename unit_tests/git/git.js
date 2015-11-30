/**
 * Created by Emmitt on 7/24/2015.
 */
'use strict';
;(function () {

    let assert = require('assert');
    let rimraf = require('rimraf');
    let path = require('path');
    let mkdirp = require('mkdirp');
    let Uploader = require('../../app/js/uploader').Uploader;
    let fs = require('fs');
    let Git = require('../../app/js/git').Git;

    describe('@Git', function () {
        describe('@GitPush', function (done) {
            this.timeout(20000);
            var success = null;
            let repoDir = path.resolve("unit_tests/git/testrepo");
            let testFile = path.join(repoDir, "sample.txt");

            before(function(done){
                mkdirp(repoDir);
                fs.unlink(testFile);
                fs.writeFile(testFile, "A line");
                let repo = "uw-unittest-en";

                let git = new Git();
                git.init(repoDir).then(function(){
                    git.stage(repoDir);
                }).then(function(){
                    let uploader = new Uploader();
                    uploader.setSshPath(path.resolve("app/ssh"));
                    return uploader.register();
                }).then(function(reg){
                    return git.push(repoDir,repo,reg);
                }).then(function(ret){
                    success = ret.stdout.indexOf("Branch master set up to track");
                    done();
                    return success;
                });
            });
            after(function(done) {
                rimraf(repoDir, function() {
                    done();
                });
            });
            it('should test a git push', function () {
                assert.notEqual(success, -1);
            });
        });
    });
})();
