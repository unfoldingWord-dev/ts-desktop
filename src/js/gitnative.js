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

    return {

        getHash: function (dir) {
            return cmd().cd(dir).and.do('git rev-parse HEAD').run();
        },

        init: function (dir) {
            return utils.fs.readdir(dir).then(function (files) {
                var init = cmd().cd(dir).and.do('git init');
                var hasGitFolder = (files.indexOf('.git') >= 0);

                return !hasGitFolder && init.run();
            }).then(logr('Git is initialized'));
        },

        commitAll: function (user, dir) {
            var msg = new Date();
            var username = user.username || 'tsDesktop';
            var email = user.email || 'you@example.com';
            var stage = cmd().cd(dir)
                    .and.do('git config user.name "${username}"')
                    .and.do('git config user.email "${email}"')
                    .and.do('git add --all')
                    .and.do(`git commit -am "${msg}"`);

            return stage.run().then(logr('Files are committed'));
        },

        merge: function (user, localPath, remotePath) {
            var localManifestPath = path.join(localPath, 'manifest.json');
            var remoteManifestPath = path.join(remotePath, 'manifest.json');

            // NOTE: should switch to using a fetch/merge instead of pull, so we don't depend on Perl
            var pull = cmd().cd(localPath).and.do('git pull ${remotePath} master');

            return Promise.all([utils.fs.readFile(localManifestPath), utils.fs.readFile(remoteManifestPath)])
                .then(function (fileData) {
                    var localManifest = JSON.parse(fileData[0]);
                    var remoteManifest = JSON.parse(fileData[1]);
                    mergedManifest = localManifest;
                    mergedManifest.translators = _.union(localManifest.translators, remoteManifest.translators);
                    mergedManifest.finished_chunks = _.union(localManifest.finished_chunks, remoteManifest.finished_chunks);
                })

            return pull.run().then(logr('Merged repo'));
        },

        push: function (user, dir, repo, opts) {
            // TODO: check opts.requestToPublish and create the appropriate publish tag if needed

            var ssh = `ssh -i "${user.reg.paths.privateKeyPath}" -o "StrictHostKeyChecking no"`;
            var pushUrl = user.reg ? repo.ssh_url : repo.html_url;
            var gitSshPush = `git push -u ${pushUrl} master`;
            var push = cmd().cd(dir).and.set('GIT_SSH_COMMAND', ssh).do(gitSshPush);

            console.log('Starting push to server...\n' + push);

            return push.run().then(logr('Files are pushed'));
        },

        clone: function (repoUrl, localPath) {
            var repoName = repoUrl.replace(/\.git/, '').split('/').pop();
            var savePath = localPath.includes(repoName) ? localPath : path.join(localPath, repoName);
            var clone = cmd().do('git clone ${repoUrl} ${localPath}');

            return clone.run().then(logr('Project cloned'));
        }
    };
}

module.exports.Git = Git;
