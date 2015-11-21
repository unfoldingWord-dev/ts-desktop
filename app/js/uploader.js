// uploader module

;(function () {
    'use strict';

    let net = require('net');
    let keypair = require('keypair');
    let jsonfile = require('jsonfile');
    let mkdirp = require('mkdirp');
    let getmac = require('getmac');
    //let sshClient = require('ssh2').Client;

    let key = 'ssh-rsa';
    let defaultHost = 'ts.door43.org';
    let defaultPort = 9095;
    let targetDir = 'ssh/';
    let targetFile = targetDir + 'pair.json';
    let username = '';
    let client;

    function Uploader() {
        return {
            register: function (host, port, deviceId, callback) {
                defaultHost = host;
                defaultPort = port;
                var pair = keypair();
                uploader.writeKeyPairToFile(pair);

                key = key + ' ' + pair.public + ' ' + deviceId;
                client = net.createConnection({port: port, host: host}, function () {
                    var connectionJson = {'key': key, 'udid': deviceId, 'username': username};
                    client.write(JSON.stringify(connectionJson));
                });
                client.on('data', function (data) {
                    if (typeof callback === 'function') {
                        callback(JSON.parse(data.toString()), pair);
                    }
                    client.end();
                });
                client.on('end', function () {
                    console.log('Disconnected from ' + host + ':' + port);
                });
            },

            verifyProfile: function (profile) {
                return profile.getName() !== '' && profile.getEmail() !== '';
            },

            disconnect: function () {
                client && client.destroy(), client = null;
            },

            writeKeyPairToFile: function (pair) {
                mkdirp(targetDir, function () {
                    try {
                        jsonfile.writeFileSync(targetFile, pair);
                    } catch (e) {
                        throw new Error('uploader.js could not write keypair file');
                    }
                });

            },
            
            // needToRegister: function (callback) {
            //     jsonfile.readFile(targetFile, function (err, keypair) {
            //         if (err === null) {
            //             // No need to register if keypair exists
            //             if (typeof callback === 'function') {
            //                 callback(false, keypair);
            //             }
            //         } else {
            //             // Need to register if keypair doesn't exist
            //             if (typeof callback === 'function') {
            //                 callback(true);
            //             }
            //         }
            //     });
            // },

            needToRegister: function() {
                return new Promise(function(resolve, reject) {
                    jsonfile.readFile(targetFile, function(err, keypair) {
                        err ? resolve(err) : reject(keypair);
                    });
                });
            },

            getDeviceId: function (callback) {
                getmac.getMac(function (err, mac) {
                    if (err) {
                        throw new Error('uploader.js could not get a mac address.');
                    }
                    if (typeof callback === 'function') {
                        callback(mac);
                    }
                });

            }
        };
    }

    exports.Uploader = Uploader;
})();
