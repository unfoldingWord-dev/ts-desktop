// git module

'use strict';

var path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec,
    utils = require('../js/lib/util'),
    log = utils.log,
    logr = utils.logr;

function Git() {

    function cmd(s) {
        var str = s || '';

        return {
            cd: function (dir) {
                return cmd(str + 'cd "' + dir + '"');
            },

            get and () {
                return cmd(str + ' && ');
            },

            get then () {
                var c = process.platform === 'win32' ? '& ' : '; ';

                return cmd(str + c);
            },

            get or () {
                return cmd(str + ' || ');
            },

            set: function (name, val) {
                var c = process.platform === 'win32' ?
                            `set ${name}=${val} & ` :
                            `${name}='${val}' `;

                return cmd(str + c);
            },

            do: function (c) {
                return cmd(str + c);
            },

            run: function () {
                return new Promise(function (resolve, reject) {
                    exec(str, function (err, stdout, stderr) {
                        var ret = {
                            stdout: stdout,
                            stderr: stderr,
                            error: err
                        };

                        (err && reject(ret)) || resolve(ret);
                    });
                });
            },

            toString: function () {
                return str;
            }
        };
    }

    function readdir(dir) {
        return new Promise(function (resolve, reject) {
            fs.readdir(dir, function (err, files) {
                (err && reject(err)) || resolve(files);
            });
        });
    }

    return {

        // Get the commit hash of a git folder
        getHash: function(dir) {
            let hash = cmd().cd(dir).and.do('git rev-parse HEAD');
            return hash.run()
                .then(function(data) { return data.stdout.trim(); })
                .catch(function(err) { console.error(err.stderr); })
            ;
        },

        // Initialize folder as git repository if it's not one already
        init: function(dir) {
            return readdir(dir).then(function (files) {
                var init = cmd().cd(dir).and.do('git init'),
                    hasGitFolder = (files.indexOf('.git') >= 0);

                return !hasGitFolder && init.run();
            }).then(logr('Git is initialized'));
        },

        // Add and commit all changed files with the given message
        stage: function(dir) {
            var msg = new Date(),
                stage = cmd().cd(dir)
                    .and.do('git config user.name "tsDesktop"')
                    .and.do('git config user.email "you@example.com"')
                    .and.do('git add --all')
                    .and.do(`git commit -am "${msg}"`);

            return stage.run()
                .then(logr('Files are staged'))
            ;
        },

        // Push staged files to remote repo
        push: function(dir, repo, reg, config) {
            // TODO: the host and port need to be retrieved from the configuration
            // NOTE: DONE. host and port is configured in config param when called
            var ssh = `ssh -i "${reg.paths.privateKeyPath}" -o "StrictHostKeyChecking no"`,
                gitSshPush = `git push -u -f ssh://${config.host}:${config.port}/tS/${reg.deviceId}/${repo} master`,
                push = cmd().cd(dir).and.set('GIT_SSH_COMMAND', ssh).do(gitSshPush);

            log('Starting push to server...\n' + push);

            return push.run().then(logr('Files are pushed'));
        },

        // Check for changes
        diff: function(dir) {
            var diff = cmd().cd(dir).and.do('git diff HEAD');
            return diff.run().then(logr('Diff is run'));
        },
    };
}

module.exports.Git = Git;
