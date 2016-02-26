// uploader module

'use strict';

var net = require('net'),
    jsonfile = require('jsonfile'),
    getmac = require('getmac'),
    path = require('path'),
    rimraf = require('rimraf'),
    fs = require('fs'),
    _ = require('lodash'),
    utils = require('../js/lib/util'),
    log = utils.log,
    wrap = utils.promisify,
    guard = utils.guard,
    mkdirp = wrap(null, require('mkdirp')),
    keypair = require('keypair'),
    forge = require('node-forge'),
    getMac = wrap(getmac, 'getMac'),
    write = wrap(fs, 'writeFile'),
    read = wrap(fs, 'readFile'),
    chmod = wrap(fs, 'chmod'),
    readdir = wrap(fs, 'readdir'),
    map = guard('map');

// TODO: this module has diverged from it's original intent and how the name is misleading.
// All this module is doing is registering with the authentication server
function Uploader() {

    var paths = {
        sshPath: path.resolve(path.join(__dirname, '..', '..', 'ssh')),

        publicKeyName: 'ts.pub',

        privateKeyName: 'ts',

        get publicKeyPath () {
            return path.join(this.sshPath, this.publicKeyName);
        },

        get privateKeyPath () {
            return path.join(this.sshPath, this.privateKeyName);
        }
    };

    var generateRegisterRequestString = function (keyPair, deviceId) {
        return JSON.stringify({
            key: keyPair.public,
            udid: deviceId
        });
    };

    var createKeyPair = function (deviceId) {

        let keyPath = path.join(paths.sshPath, paths.privateKeyName);

        return mkdirp(paths.sshPath).then(function () {
            var pair = keypair(),
                publicKey = forge.pki.publicKeyFromPem(pair.public),
                publicSsh = forge.ssh.publicKeyToOpenSSH(publicKey, deviceId),
                privateKey = forge.pki.privateKeyFromPem(pair.private),
                privateSsh = forge.ssh.privateKeyToOpenSSH(privateKey);

            return {
                public: publicSsh,
                private: privateSsh
            };
        }).then(function (keys) {
            log('Keys created!');

            var writePublicKey = write(paths.publicKeyPath, keys.public),
                writePrivateKey = write(paths.privateKeyPath, keys.private).then(function () {
                    return chmod(paths.privateKeyPath, '600');
                });

            return Promise.all([writePublicKey, writePrivateKey]).then(function () {
                return keys;
            });
        });
    };

    var readKeyPair = function () {
        return readdir(paths.sshPath).then(function (files) {
            var hasPubKey = _.includes(files, paths.publicKeyName),
                hasPrivateKey = _.includes(files, paths.privateKeyName),
                hasBoth = hasPubKey && hasPrivateKey;

            if (!hasBoth) {
                throw 'No keypair found';
            }

            return hasBoth;
        })
        .then(function() {
            var readPubKey = read(paths.publicKeyPath),
                readSecKey = read(paths.privateKeyPath);

            return Promise.all([readPubKey, readSecKey]);
        })
        .then(map(String))
        .then(_.zipObject.bind(_, ['public', 'private']));
    };

    var sendRegistrationRequest = function(host, port, deviceId, keys) {

        return new Promise(function (resolve, reject) {

            var client = net.createConnection({port: port, host: host}, function () {
                var registrationString = generateRegisterRequestString(keys, deviceId);
                client.write(registrationString);
            });

            client.on('data', function (data) {
                var response = JSON.parse(data.toString());

                if (response.error) {
                    throw response.error;
                }

                resolve({
                    keys: keys,
                    deviceId: deviceId,
                    response: response
                });

                client.end();
            });

            client.on('end', function () {
                log('Disconnected from ' + host + ':' + port);
            });

        });
    };

    return {

        get sshPath () {
            return paths.sshPath;
        },

        set sshPath (path) {
            paths.sshPath = path;
        },

        register: function (config) {
            // TODO: the host and port need to be retrieved from the configuration
            // NOTE: DONE. Pass those info in config and it will override the host and the port below
            var opts = _.merge({}, {
                host: 'ts.door43.org',
                port: 9095
            }, config);

            var getDeviceId = opts.deviceId ? Promise.resolve(opts.deviceId) : this.getDeviceId();

            return getDeviceId.then(function (deviceId) {

                return readKeyPair().then(function (keys) {
                    return {
                        keys: keys,
                        deviceId: deviceId
                    };
                }).catch(function (err) {
                    var sendReg = sendRegistrationRequest.bind(null, opts.host, opts.port, deviceId);

                    return createKeyPair(deviceId).then(sendReg);
                }).then(function (reg) {
                    reg.paths = paths;
                    return reg;
                });
            });
        },

        /**
         * Deletes the ssh keys. They will be regenerated/registered next time we publish
         */
        destroyKeys: function () {
            rimraf.sync(paths.sshPath);
        },

        verifyProfile: function (profile) {
            return profile.getName() !== '' && profile.getEmail() !== '';
        },

        getDeviceId: function() {
            return getMac().then(function (mac) {
                return mac.replace(/-|:/g, '');
            });
        }
    };
}

exports.Uploader = Uploader;
