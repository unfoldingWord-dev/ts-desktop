'use strict';

var path = require('path'),
    utils = require('../js/lib/utils'),
    _ = require('lodash'),
    keypair = require('keypair'),
    forge = require('node-forge');

function KeyManager(dataPath) {

    var paths = {
        sshPath: path.resolve(path.join(dataPath, 'ssh')),

        publicKeyName: 'ts.pub',

        privateKeyName: 'ts',

        get publicKeyPath () {
            return path.join(this.sshPath, this.publicKeyName);
        },

        get privateKeyPath () {
            return path.join(this.sshPath, this.privateKeyName);
        }
    };

    var createKeyPair = function (deviceId) {

        return utils.fs.mkdirs(paths.sshPath).then(function () {
            var pair = keypair(),
                publicKey = forge.pki.publicKeyFromPem(pair.public),
                publicSsh = forge.ssh.publicKeyToOpenSSH(publicKey, deviceId),
                privateKey = forge.pki.privateKeyFromPem(pair.private),
                privateSsh = forge.ssh.privateKeyToOpenSSH(privateKey);

            return {
                public: publicSsh,
                private: privateSsh
            };
        })
        .then(utils.logr('Keys created!'))
        .then(function (keys) {
            var writePublicKey = utils.fs.outputFile(paths.publicKeyPath, keys.public),
                writePrivateKey = utils.fs.outputFile(paths.privateKeyPath, keys.private).then(function () {
                    return utils.fs.chmod(paths.privateKeyPath, '600');
                });

            return Promise.all([writePublicKey, writePrivateKey]).then(utils.ret(keys));
        });
    };

    var readKeyPair = function () {
            var readPubKey = utils.fs.readFile(paths.publicKeyPath),
                readSecKey = utils.fs.readFile(paths.privateKeyPath);

        return Promise.all([readPubKey, readSecKey])
            .then(utils.lodash.map(String))
            .then(_.zipObject.bind(_, ['public', 'private']));
    };

    return {

        get sshPath () {
            return paths.sshPath;
        },

        set sshPath (path) {
            paths.sshPath = path;
        },

        getRegistrationInfo: function (deviceId) {
            return readKeyPair().then(function (keys) {
                return {keys, deviceId, paths};
            });
        },

        generateRegistrationInfo: function (deviceId) {
            return createKeyPair(deviceId).then(function (keys) {
                return {keys, deviceId, paths};
            });
        },

        destroyKeys: function () {
            return utils.fs.remove(paths.sshPath);
        }
    };
}

module.exports.KeyManager = KeyManager;
