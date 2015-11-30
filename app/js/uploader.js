// uploader module

;(function () {
    'use strict';

    var net = require('net'),
        keygen = require('ssh-keygen'),
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
        chmod = wrap(fs, 'chmod'),
        readdir = wrap(fs, 'readdir'),
        map = guard('map');

    function Uploader() {

        var paths = {
            sshPath: path.resolve('ssh'),

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
            console.log("generating request string");
            console.log(deviceId);

            return JSON.stringify({
                key: keyPair.public,
                udid: deviceId
            });
        };

        var createKeyPair = function (deviceId) {


            return new Promise(function(resolve, reject){
                console.log("starting keygen promise");
                keygen({
                    location: paths.sshPath + "/ts",
                    comment: deviceId,
                    read: true
                }, function(err, out){
                    if(err) return console.log('Something went wrong: '+err);
                    console.log('Keys created!');
                    console.log('private key: '+out.key);
                    console.log('public key: '+out.pubKey);

                    var keys = {
                        public: out.pubKey,
                        private: out.key
                    };

                    resolve( mkdirp(paths.sshPath).then(function () {
                        var writePublicKey = write(paths.publicKeyPath, out.pubKey),
                            writePrivateKey = write(paths.privateKeyPath, out.key).then(function () {
                                return chmod(paths.privateKeyPath, '600');
                            });

                        return Promise.all[writePublicKey, writePrivateKey];
                    }).then(function() {
                        return keys;
                    }));
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
                    console.log("reg string: " + registrationString);
                    client.write(registrationString);
                });

                client.on('data', function (data) {
                    console.log("response: " + data.toString());
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
                    console.log('Disconnected from ' + host + ':' + port);
                });

            });
        };

        return {

            setSshPath: function(path){
                paths.sshPath = path;
                console.log("ssh path: " + path);
            },

            register: function (host, port) {
                console.log("beginning registration");
                var opts = {
                    host: host || 'test.door43.org',
                    port: port || 9095
                };

                return this.getDeviceId().then(function (deviceId) {
                    console.log("got device id: " + deviceId);

                    return readKeyPair().then(function (keys) {
                        console.log("found keys");
                        return {
                            keys: keys,
                            deviceId: deviceId
                        };
                    }).catch(function (err) {
                        console.log("no keys: " + err);
                        return createKeyPair(deviceId).then(function(keys){
                            return sendRegistrationRequest(opts.host, opts.port, deviceId,keys);
                        });
                    }).then(function (reg) {
                        reg.paths = paths;
                        return reg;
                    });
                });
            },

            verifyProfile: function (profile) {
                return profile.getName() !== '' && profile.getEmail() !== '';
            },

            getDeviceId: function() {
                console.log("getting device id");
                return new Promise(function(resolve, reject) {
                    getmac.getMac(function(err, mac) {
                        var m = mac.replace(/-|:/g, '');

                        err ? reject(err) : resolve(m);
                    });
                });
            }
        };
    }

    exports.Uploader = Uploader;
})();
