'use strict';

var NodeGit,
    path = require('path'),
    utils = require('../js/lib/utils'),
    _ = require('lodash');

try {
    NodeGit = require('nodegit');
} catch(e) {
    if(process.env.NODE_ENV !== 'test') {
        throw e;
    }
}

function GitManager() {

    var logr = utils.logr;

    return {

        getHash: function (dir) {
            return NodeGit.Repository.open(dir).then(function (repo) {
                return repo.getCurrentBranch();
            }).then(function (ref) {
                return ref.target().toString();
            });
        },

        init: function (dir) {
            return utils.fs.readdir(dir).then(function (files) {
                var hasGitFolder = (files.indexOf('.git') >= 0);

                return !hasGitFolder ? NodeGit.Repository.init(dir, 0) : false;
            }).then(logr('Git is initialized'));
        },

        stage: function (user, dir) {
            let author = NodeGit.Signature.now(user.username || 'tsDesktop', user.email || 'you@example.com'),
                committer = author;

            let repo, index, oid;

            return NodeGit.Repository.open(dir)
                .then(function(repoResult) {
                    repo = repoResult;
                    return repo.openIndex();
                })
                .then(function(indexResult) {
                    index = indexResult;
                    return index.read(1);
                })
                .then(function() {
                    // Get all added files
                    return index.addAll();
                })
                .then(function() {
                    // Get all changed/deleted files
                    return index.updateAll();
                })
                .then(function() {
                    return index.write();
                })
                .then(function() {
                    return index.writeTree();
                })
                .then(function(oidResult) {
                    oid = oidResult;

                    return repo.getHeadCommit();
                })
                .then(function(head) {
                    let parents = head ? [head] : [];

                    return repo.createCommit('HEAD', author, committer, (new Date()).toString(), oid, parents);
                })
                .then(function(commitId) {
                    return commitId;
                })
                .then(logr('Files are staged'));
        },

        push: function (user, dir, repo) {
            let localrepo,
                isSSH = !!user.reg;

            return NodeGit.Repository.open(dir)
                .then(function(repoResult) {
                    localrepo = repoResult;
                    return localrepo.openIndex();
                })
                .then(function() {
                    let remoteUrl = isSSH ? repo.ssh_url : repo.html_url;

                    return NodeGit.Remote.createAnonymous(localrepo, remoteUrl);
                })
                .then(function(remote) {
                    return remote.push(['refs/heads/master:refs/heads/master'], {
                        callbacks: {
                            certificateCheck: function () {
                                // no certificate check, let it pass thru
                                return true;
                            },
                            credentials: function (url, username) {
                                if (isSSH) {
                                    return NodeGit.Cred.sshKeyNew(
                                        username,
                                        user.reg.paths.publicKeyPath,
                                        user.reg.paths.privateKeyPath,
                                        ''
                                    );
                                }

                                return NodeGit.Cred.userpassPlaintextNew(user.username, user.password);
                            }
                        }
                    });
                })
                .then(logr('Files are pushed', repo));
        },

        clone: function (repoUrl, localPath) {
            var repoName = repoUrl.replace(/\.git/, '').split('/').pop();
            var savePath = localPath.includes(repoName) ? localPath : path.join(localPath, repoName);

            return NodeGit.Clone(repoUrl, savePath, {
                checkoutBranch: 'master',

                fetchOpts: {
                    callbacks: {
                        certificateCheck: function () {
                            return 1;
                        }
                    }
                }
            });
        },

        pull: function() {
            throw 'Not implemented';
        }

    };
}

module.exports.GitManager = GitManager;
