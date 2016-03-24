// git interface module

'use strict';

let Git = require('nodegit'),
    utils = require('../js/lib/util'),
    wrap = utils.promisify,
    logr = utils.logr,
    _ = require('lodash'),
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

        login: function (userObj) {
            return api.getUser(userObj, auth).then(function (user) {
                return api.listTokens(userObj)
                    .then(function (tokens) {
                        return _.find(tokens, tokenStub);
                    })
                    .then(function (token) {
                        return token ? token : api.createToken(tokenStub, userObj);
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

        stage: function (user, dir) {
            if (!user.username || !user.email) {
                return Promise.reject('User must have a username and email');
            }

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

                    let author = Git.Signature.now(user.username, user.email);
                    let committer = Git.Signature.now(user.username, user.email);

                    return repo.createCommit('HEAD', author, committer, (new Date()).toString(), oid, parents);
                })
                .then(function(commitId) {
                    return commitId;
                })
                .then(logr('Files are staged'));
        },

        push: function (user, dir, reponame, config) {
            let repo;

            return Git.Repository.open(dir)
                .then(function(repoResult) {
                    repo = repoResult;
                    return repo.openIndex();
                })
                .then(function() {
                    let remoteUrl = `https://${user.username}:${user.password}@${config.host}/${user.username}/${reponame}`;
                    return Git.Remote.createAnonymous(repo, remoteUrl);
                })
                .then(function(remote) {
                    return remote.push(['+refs/heads/master:refs/heads/master'], {
                        callbacks: {
                            certificateCheck: function () {
                                // no certificate check, let it pass thru
                                return true;
                            },
                            credentials: function () {
                                return Git.Cred.userpassPlaintextNew(user.username, user.password);
                            }
                        }
                    });
                })
                .then(logr('Files are pushed'));
        },

        clone: function() {
            throw 'Not implemented';
        },

        pull: function() {
            throw 'Not implemented';
        }

    };
}

module.exports = GitInterface;
