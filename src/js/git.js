// git interface module

'use strict';

let Git = require('nodegit'),
    utils = require('../js/lib/util'),
    wrap = utils.promisify,
    logr = utils.logr,
    fs = require('fs'),
    readdir = wrap(fs, 'readdir'),
    Gogs = require('gogs-client');

function GitInterface(auth) {

    let api = new Gogs('https://git.door43.org/api/v1'),
        tokenStub = { name: 'ts-desktop' };

    return {

        createAccount: function (user) {
            return api.createUser(user, auth).then(function (newUser) {
                // Merge the user objects temporarily so that we get the 'password' field
                var mergedUser = _.merge(user, newUser);

                return api.createToken(tokenStub, mergedUser).then(function(token) {
                    newUser.token = token;
                    return newUser;
                });
            });
        },

        login: function (username, password) {
            return api.getUser({ username, password }, auth).then(function (user) {
                return api.listTokens(_.merge({ password }, user))
                    .then(function (tokens) {
                        return _.find(tokens, tokenStub);
                    })
                    .then(function (token) {
                        return token ? token : api.createToken(tokenStub, user);
                    })
                    .then(function (token) {
                        user.token = token;
                        return user;
                    });
            });
        },

        // Returns the last commit hash/id for the repo at dir
        getHash: function (dir) {
            return Git.Repository.open(dir).then(function (repo) {
                return repo.getCurrentBranch();
            }).then(function (ref) {
                return ref.target().toString();
            });
        },

        init: function (dir) {
            return readdir(dir).then(function (files) {
                var hasGitFolder = (files.indexOf('.git') >= 0);

                return !hasGitFolder ? Git.Repository.init(dir, 0) : false;
            }).then(logr('Git is initialized'));
        },

        stage: function (dir, username, email) {
            username = username || 'tsDesktop';
            email = email || 'you@example.com';

            let repo, index, oid;

            return Git.Repository.open(dir)
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

                    let author = Git.Signature.now(username, email);
                    let committer = Git.Signature.now(username, email);

                    return repo.createCommit("HEAD", author, committer, (new Date()).toString(), oid, parents);
                })
                .then(function(commitId) {
                    return commitId;
                })
                .then(logr('Files are staged'));
        },

        push: function (dir, repo, reg, config) {
            let r;

            return Git.Repository.open(dir)
                .then(function(repoResult) {
                    r = repoResult;
                    return r.openIndex();
                }).then(function() {
                    let remoteUrl = `ssh://${config.host}:${config.port}/tS/${reg.deviceId}/${repo}`;
                    return Git.Remote.create(r, 'origin', remoteUrl);
                }).then(function (remote) {
                    return remote ? remote : r.getRemote('origin');
                }).then(function(remote) {
                    let opts = {
                        callbacks: {
                            certificateCheck: function () {
                                // no certificate check
                                return 1;
                            },
                            credentials: function (url, userName) {
                                return Git.Cred.sshKeyNew(
                                    userName,
                                    reg.paths.publicKeyPath,
                                    reg.paths.privateKeyPath,
                                    ""
                                );
                            }
                        }
                    };

                    return remote.push(["+refs/heads/master:refs/heads/master"], opts);
                }).then(logr('Files are pushed'));
        },

        clone: function() {
            console.log('not implemented');
        },

        pull: function() {
            console.log('not implemented');
        }

    };
}

module.exports = GitInterface;
