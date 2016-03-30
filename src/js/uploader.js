// uploader module

'use strict';

var net = require('net'),
    path = require('path'),
    utils = require('../js/lib/util'),
    _ = utils._,
    logr = utils.logr,
    fs = utils.fs,
    keypair = require('keypair'),
    forge = require('node-forge');

// TODO: this module has diverged from it's original intent and how the name is misleading.
// All this module is doing is registering with the authentication server
function Uploader(dataPath) {

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

        let keyPath = path.join(paths.sshPath, paths.privateKeyName);

        return utils.mkdirp(paths.sshPath).then(function () {
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
        .then(logr('Keys created!'))
        .then(function (keys) {
            var writePublicKey = fs.writeFile(paths.publicKeyPath, keys.public),
                writePrivateKey = fs.writeFile(paths.privateKeyPath, keys.private).then(function () {
                    return fs.chmod(paths.privateKeyPath, '600');
                });

            return Promise.all([writePublicKey, writePrivateKey]).then(utils.ret(keys));
        });
    };

    var readKeyPair = function () {
            var readPubKey = fs.readFile(paths.publicKeyPath),
                readSecKey = fs.readFile(paths.privateKeyPath);

        return Promise.all([readPubKey, readSecKey])
            .then(utils.map(String))
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

        /**
         * Deletes the ssh keys. They will be regenerated/registered next time we publish
         */
        destroyKeys: function () {
            return utils.rm(paths.sshPath);
        }
    };
}

exports.Uploader = Uploader;
