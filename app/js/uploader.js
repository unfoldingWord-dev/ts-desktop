// uploader module

;(function () {
    'use strict';

    var net = require('net'),
        keypair = require('keypair'),
        jsonfile = require('jsonfile'),
        mkdirP = require('mkdirp'),
        getmac = require('getmac'),
        path = require('path'),
        fs = require('fs'),
        _ = require('lodash'),
        utils = require('../js/lib/util'),
        wrap = utils.promisify,
        guard = utils.guard,
        mkdirp = wrap(null, mkdirP),
        write = wrap(fs, 'writeFile'),
        read = wrap(fs, 'readFile'),
        readdir = wrap(fs, 'readdir'),
        map = guard('map');

    function Uploader() {

        var paths = {
            sshPath: path.resolve('ssh'),

            publicKeyName: 'ts-pub',

            privateKeyName: 'ts-key',

            get publicKeyPath () {
                return path.join(this.sshPath, this.publicKeyName);
            },

            get privateKeyPath () {
                return path.join(this.sshPath, this.privateKeyName);
            }
        };

        var generateRegisterRequestString = function (keyPair, deviceId) {
            var pubKey = keyPair.public,
                parsedPubKey = pubKey.replace(/\n/g, '')
                                     .replace(/-----BEGIN RSA PUBLIC KEY-----/, '')
                                     .replace(/-----END RSA PUBLIC KEY-----/, '');

            return JSON.stringify({
                key: ['ssh-rsa', parsedPubKey, deviceId].join(' '),
                udid: deviceId,
                username: ''
            });
        };

        var createKeyPair = function () {
            var keys = keypair();

            return mkdirp(paths.sshPath).then(function () {
                var writePublicKey = write(paths.publicKeyPath, keys.public),
                    writePrivateKey = write(paths.privateKeyPath, keys.private);

                return Promise.all[writePublicKey, writePrivateKey];
            }).then(function() {
                return keys;
            });
        };

        var readKeyPair = function () {
            return readdir(paths.sshPath).then(function (files) {
                debugger;

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
                    resolve({
                        keys: keys,
                        deviceId: deviceId,
                        response: JSON.parse(data.toString())
                    });

                    client.end();
                });

                client.on('end', function () {
                    console.log('Disconnected from ' + host + ':' + port);
                });

            });
        };

        return {

            register: function (host, port) {
                debugger;

                var opts = {
                    host: host || 'ts.door43.org',
                    port: port || 9095
                };

                return this.getDeviceId().then(function (deviceId) {

                    return readKeyPair().then(function (keys) {
                        debugger;

                        return {
                            keys: keys,
                            deviceId: deviceId
                        };
                    }).catch(function () {
                        debugger;

                        var sendReg = sendRegistrationRequest.bind(null, host, port, deviceId);

                        return createKeyPair().then(sendReg);
                    }).then(function (reg) {
                        debugger;

                        reg.paths = paths;
                        return reg;
                    });
                });
            },

            verifyProfile: function (profile) {
                return profile.getName() !== '' && profile.getEmail() !== '';
            },

            getDeviceId: function() {
                debugger;

                return new Promise(function(resolve, reject) {
                    getmac.getMac(function(err, mac) {
                        debugger;

                        var m = mac.replace(/-|:/g, '');

                        err ? reject(err) : resolve(m);
                    });
                });
            }
        };
    }

    exports.Uploader = Uploader;
})();
