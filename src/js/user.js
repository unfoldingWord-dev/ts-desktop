'use strict';

var _ = require('lodash'),
    Gogs = require('gogs-client');

function UserManager(auth, server) {

    var api = new Gogs(server + '/api/v1'),
        tokenStub = {name: 'ts-desktop'};

    return {

        deleteAccount: function (user) {
            return api.deleteUser(user, auth);
        },

        createAccount: function (user) {
            return api.createUser(user, auth, true)
                .then(function(updatedUser) {
                    return api.createToken(tokenStub, user)
                        .then(function(token) {
                            updatedUser.token = token.sha1;
                            return updatedUser;
                        });
                });
        },

        login: function (userObj) {
            return api.getUser(userObj).then(function (user) {
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

        register: function (user, deviceId) {
            var keyStub = {title: 'ts-desktop ' + deviceId};
            return api.listPublicKeys(user).then(function (keys) {
                return _.find(keys, keyStub);
            }).then(function (key) {
                return key ? key : api.createPublicKey({
                    title: keyStub.title,
                    key: user.reg.keys.public
                }, user);
            });
        },

        unregister: function (user, deviceId) {
            var keyStub = {title: 'ts-desktop ' + deviceId};
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

        retrieveRepos: function (u, q) {
            u = u === '*' ? '' : (u || '');
            q = q === '*' ? '_' : (q || '_');

            var limit = 100;

            function searchUsers (visit) {
                return api.searchUsers(u, limit).then(function (users) {
                    var a = users.map(visit);

                    a.push(visit(0).then(function (repos) {
                        return repos.filter(function (repo) {
                            var username = repo.full_name.split('/').shift();
                            return username.includes(u);
                        });
                    }));

                    return Promise.all(a);
                });
            }

            function searchRepos (user) {
                var uid = (typeof user === 'object' ? user.id : user) || 0;
                return api.searchRepos(q, uid, limit);
            }

            var p = u ? searchUsers(searchRepos) : searchRepos();

            return p.then(_.flatten).then(function (repos) {
                return _.uniq(repos, 'id');
            })
            .then(function (repos) {
                return _.map(repos, function (repo) {
                    var user = repo.full_name.split("/")[0];
                    var project = repo.full_name.split("/")[1];
                    return {repo: repo.full_name, user: user, project: project};
                })
            });
        }

    };
}

module.exports.UserManager = UserManager;
