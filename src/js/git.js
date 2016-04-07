// git interface module

'use strict';

let Git,
    utils = require('../js/lib/utils'),
    wrap = utils.promisify,
    logr = utils.logr,
    _ = require('lodash'),
    fs = require('fs'),
    readdir = wrap(fs, 'readdir'),
    Gogs = require('gogs-client');

try {
    Git = require('nodegit');
} catch(e) {
    if(process.env.NODE_ENV !== 'test') {
        throw e;
    }
}

function GitInterface(auth) {

    let api = new Gogs('https://git.door43.org/api/v1'),
        tokenStub = {name: 'ts-desktop'},
        keyStub = {title: 'ts-desktop'};

    return {

        /**
         * Deletes a users' account
         * @param user {object} the user to be deleted. Requires username
         * @returns {Promise} resolves if successful
         */
        deleteAccount: function (user) {
            return api.deleteUser(user, auth);
        },

        /**
         * Creates a new user account.
         * The users' full name will be added to their gogs profile
         * and an access token will be created and attached to the returned user object
         * @param user {object} the user to be created. Requires username, full_name, email, password
         * @returns {Promise.<object>} the newly created user
         */
        createAccount: function (user) {
            return api.createUser(user, auth, true)
                .then(function (newUser) {
                    // TRICKY: we must edit the user to set full_name
                    return api.editUser(user, auth);
                })
                .then(function(updatedUser) {
                    return api.createToken(tokenStub, user)
                        .then(function(token) {
                            updatedUser.token = token.sha1;
                            return updatedUser;
                        });
                });
        },

        /**
         * Logs in to a gogs account.
         *
         * @param userObj the user to log in as. Requires username, password
         * @returns {Promise.<object>} the user object
         */
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
                        user.token = token.sha1;
                        return user;
                    });
            });
        },

        register: function (user) {
            return api.listPublicKeys(user).then(function (keys) {
                return _.find(keys, keyStub);
            }).then(function (key) {
                return key ? key : api.createPublicKey({
                    title: keyStub.title,
                    key: user.reg.keys.public
                }, user);
            });
        },

        unregister: function (user) {
            return api.listPublicKeys(user).then(function (keys) {
                return _.find(keys, keyStub);
            }).then(function (key) {
                return key ? api.deletePublicKey(key, user) : false;
            });
        },

        createRepo: function (user, reponame) {
            return api.listRepos(user).then(function (repos) {
                return _.find(repos, {full_name: user.username + '/' + reponame});
            }).then(function (repo) {
                return repo ? repo : api.createRepo({
                    name: reponame,
                    description: 'ts-desktop: ' + reponame,
                    private: false
                }, user);
            });
        },

        // Returns the last commit hash/id for the repo at dir
        //
        /**
         * Returns the last commit hash/id for the repo at dir
         * @param dir {string} the path to the git repository
         * @returns {Promise.<string>}
         */

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
            let author = Git.Signature.now(user.username || 'tsDesktop', user.email || 'you@example.com'),
                committer = author;

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

            return Git.Repository.open(dir)
                .then(function(repoResult) {
                    localrepo = repoResult;
                    return localrepo.openIndex();
                })
                .then(function() {
                    let remoteUrl = isSSH ? repo.ssh_url : repo.html_url;

                    return Git.Remote.createAnonymous(localrepo, remoteUrl);
                })
                .then(function(remote) {
                    return remote.push(['+refs/heads/master:refs/heads/master'], {
                        callbacks: {
                            certificateCheck: function () {
                                // no certificate check, let it pass thru
                                return true;
                            },
                            credentials: function (url, username) {
                                if (isSSH) {
                                    return Git.Cred.sshKeyNew(
                                        username,
                                        user.reg.paths.publicKeyPath,
                                        user.reg.paths.privateKeyPath,
                                        ''
                                    );
                                }

                                return Git.Cred.userpassPlaintextNew(user.username, user.password);
                            }
                        }
                    });
                })
                .then(logr('Files are pushed', repo));
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
