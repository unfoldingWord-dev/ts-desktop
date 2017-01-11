'use strict';

var path = require('path'),
    utils = require('../js/lib/utils'),
    fs = require('fs'),
    cmdr = require('../js/lib/cmdr');

// NOTE: could use moment module for this
function createTagName(datetime) {
    return 'R2P/' +
        datetime.getFullYear().toString() + '-' +
        utils.padZero(datetime.getMonth()+1) + '-' +
        utils.padZero(datetime.getDate()) + '/' +
        utils.padZero(datetime.getHours()) + '.' +
        utils.padZero(datetime.getMinutes()) + '.' +
        utils.padZero(datetime.getSeconds());
}

function GitManager() {

    var logr = utils.logr;
    var toJSON = function (obj) {
        return JSON.stringify(obj, null, '\t');
    };

    // NOTE: This could be configured or passed in.
    const paths = ['/usr/local/bin'];

    const cmd = cmdr(paths);

    const minGitVersion = {
        major: 2,
        minor: 3,
        toString: function () {
            return this.major + '.' + this.minor;
        }
    };

    return {
        get _cmd () {
            return cmd;
        },

        getVersion: function () {
            var status = cmd().do('git --version');

            return status.run()
                .then(function (log) {
                    var wordarray = log.stdout.split('\n')[0].split(" ");
                    var versionstring = wordarray[2];
                    var versionarray = versionstring.split(".");

                    return {
                        major: versionarray[0],
                        minor: versionarray[1],
                        patch: versionarray[2],
                        toString: function () {
                            return wordarray.slice(2).join(' ');
                        }
                    };
                });
        },

        verifyGit: function () {
            var installed = false;

            return this.getVersion()
                .then(function (version) {
                    if (version.major < minGitVersion.major || (version.major == minGitVersion.major && version.minor < minGitVersion.minor)) {
                        installed = true;
                        throw version;
                    }
                    return version;
                })
                .catch(function (err) {
                    if (installed) {
                        var msg = "Your version of Git is out of date. We detected "  + err + ", but the app needs at least version " + minGitVersion + " in order to run.";
                        throw msg;
                    } else {
                        throw "Git is not installed. It is required to run tStudio Desktop."
                    }
                });
        },

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
                    .and.do(`git config user.name "${username}"`)
                    .and.do(`git config user.email "${email}"`)
                    .and.do('git config core.autocrlf input')
                    .and.do('git add --all')
                    .and.do(`git commit -am "${msg}"`);

            return stage.run()
                .catch(function (err) {
                    if (!err.stdout.includes('nothing to commit')) {
                        throw err;
                    }
                    return true;
                })
                .then(logr('Files are committed'));
        },

        merge: function (user, localPath, remotePath) {
            var mythis = this;
            var localManifestPath = path.join(localPath, 'manifest.json');
            var remoteManifestPath = path.join(remotePath, 'manifest.json');
            var mergedManifest = {};
            var conflictlist = [];
            var conflicts = [];

            return Promise.all([utils.fs.readFile(localManifestPath), utils.fs.readFile(remoteManifestPath)])
                .then(function (fileData) {
                    var localManifest = JSON.parse(fileData[0]);
                    var remoteManifest = JSON.parse(fileData[1]);
                    mergedManifest = localManifest;
                    mergedManifest.translators = _.union(localManifest.translators, remoteManifest.translators);
                    mergedManifest.finished_chunks = _.union(localManifest.finished_chunks, remoteManifest.finished_chunks);
                })
                .then(function () {
                    return mythis.getVersion();
                })
                .then(function (version) {
                    var diff = cmd().cd(localPath).and.do('git diff --name-only --diff-filter=U');
                    var pull = "";

                    if (version.major > 2 || (version.major == 2 && version.minor > 8)) {
                        pull = cmd().cd(localPath).and.do(`git pull "${remotePath}" master --allow-unrelated-histories`);
                    } else {
                        pull = cmd().cd(localPath).and.do(`git pull "${remotePath}" master`);
                    }

                    return pull.run()
                        .catch(function (err) {
                            if (err.stdout.includes('fix conflicts')) {
                                return diff.run()
                                    .then(function (list) {
                                        conflictlist =  list.stdout.split("\n");
                                    });
                            }
                            throw err;
                        });
                })
                .then(function () {
                    if (conflictlist.length) {
                        conflictlist.forEach(function (item) {
                            if (item.includes('.txt')) {
                                var splitindex = item.indexOf('/');
                                var dotindex = item.indexOf('.');
                                var chunk = item.substring(0, splitindex) + "-" + item.substring(splitindex + 1, dotindex);
                                conflicts.push(chunk);
                                var index = mergedManifest.finished_chunks.indexOf(chunk);
                                if (index >= 0) {
                                    mergedManifest.finished_chunks.splice(index, 1);
                                }
                            }
                        });
                    }
                })
                .then(function () {
                    if (conflicts) {
                        mythis.consolidateConflicts(localPath, conflicts);
                    }
                    return utils.fs.outputFile(localManifestPath, toJSON(mergedManifest));
                })
                .then(function () {
                    return mythis.commitAll(user, localPath);
                })
                .catch(function (err) {
                    throw "Error while merging projects: " + err.stderr;
                })
                .then(utils.logr("Finished merging"))
                .then(function () {
                    return conflicts;
                });

        },

        consolidateConflicts: function (targetPath, conflicts) {
            var conflicttest = new RegExp(/([^<=>]*)(<{7} HEAD\n)([^<=>]*)(={7}\n)([^<=>]*)(>{7} \w{40}\n?)([^]*)/);

            conflicts.forEach(function (conflict) {
                var split = conflict.split("-");
                var filePath = path.join(targetPath, split[0], split[1] + ".txt");
                var contents = fs.readFileSync(filePath, "utf8");
                var head = "";
                var middle = "";
                var tail = "";
                var first = "";
                var second = "";

                while (conflicttest.test(contents)) {
                    var pieces = conflicttest.exec(contents);

                    head = pieces[2];
                    middle = pieces[4];
                    tail = pieces[6];
                    first += pieces[1] + pieces[3];
                    second += pieces[1] + pieces[5];
                    contents = pieces[7];
                }

                first += contents;
                second += contents;
                var newcontent = head + first + middle + second + tail;
                fs.writeFileSync(filePath, newcontent);
            });
        },

        push: function (user, dir, repo, opts) {
            opts = opts || {};

            var ssh = `ssh -i "${user.reg.paths.privateKeyPath}" -o "StrictHostKeyChecking no"`;
            var pushUrl = user.reg ? repo.ssh_url : repo.html_url;
            var gitSshPush = `git push -u ${pushUrl} master --follow-tags`;
            var push = cmd().cd(dir).and.set('GIT_SSH_COMMAND', ssh).do(gitSshPush);
            var tagName = createTagName(new Date());
            var tag = opts.requestToPublish ? cmd().cd(dir).and.do(`git tag -a ${tagName} -m "Request to Publish"`).run() : Promise.resolve();

            console.log('Starting push to server...\n' + push);

            return tag
                .then(function () {
                    return push.run();
                })
                .then(logr('Files are pushed'));
        },

        clone: function (repoUrl, localPath) {
            var repoName = repoUrl.replace(/\.git/, '').split('/').pop();
            var savePath = localPath.includes(repoName) ? localPath : path.join(localPath, repoName);
            var clone = cmd().do(`git clone ${repoUrl} "${savePath}"`);

            return clone.run()
                .catch(function (err) {
                    if (err.error) {
                        throw err;
                    }
                    return err;
                })
                .then(logr('Project cloned'));
        }
    };
}

module.exports.GitManager = GitManager;
