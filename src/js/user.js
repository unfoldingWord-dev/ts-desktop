'use strict';

var _ = require('lodash'),
    Gogs = require('gogs-client');

function UserManager(auth) {

    var api = new Gogs('https://git.door43.org/api/v1'),
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
        }

    };
}

module.exports.UserManager = UserManager;
