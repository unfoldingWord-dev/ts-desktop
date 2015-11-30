/**
 * Created by Emmitt on 7/24/2015.
 */
'use strict';
;(function () {

    let assert = require('assert');
    let path = require('path');
    let Uploader = require('../../app/js/uploader').Uploader;
    let fs = require('fs');
    let Git = require('../../app/js/git').Git;

    describe('@Git', function () {
        describe('@gitPush', function (done) {
            this.timeout(10000);
            var success = null;
            before(function(done){
                let dir = path.resolve("unit_tests/git/data/testrepo");
                fs.appendFile(path.join(dir, "sample.txt"),"Another line");
                let repo = "uw-unittest-en";

                let git = new Git();
                git.init(dir).then(function(){
                    git.stage(dir);
                }).then(function(){
                    let uploader = new Uploader();
                    uploader.setSshPath(path.resolve("app/ssh"));
                    return uploader.register();
                }).then(function(reg){
                    return git.push(dir,repo,reg);
                }).then(function(ret){
                    success = ret.stdout.indexOf("Branch master set up to track");
                    done();
                    return success;
                });
            });
            it('should test a git push', function () {
                assert.notEqual(success, -1);
            });
        });
    });
})();
