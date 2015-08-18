/**
 * Created by Emmitt on 7/23/2015.
 */
var net = require('net');
var keypair = require('keypair');
var jsonfile = require('jsonfile');
var mkdirp = require('mkdirp');
var getmac = require('getmac');
var sshClient = require('ssh2').Client;
var Git = require('nodegit');

;(function () {
    'use strict';
    var key = 'ssh-rsa';
    var defaultHost = 'ts.door43.org';
    var defaultPort = 9095;
    var targetDir = 'ssh/';
    var targetFile = targetDir + 'pair.json';
    var username = 'EmmittTest';

    var client;

    var uploader = {
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
                console.log(JSON.parse(data.toString()));
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
        uploadProfile: function (profile) {
            console.log('UploaderProfile');
            throw new Error('Stop');
            /*if (uploader.verifyProfile(profile)) {
                uploader.needToRegister(function (register, keypair) {
                    if (register) {
                        uploader.getDeviceId(function (deviceId) {
                            uploader.register(defaultHost, defaultPort, deviceId, function (data, pair) {
                                if (data.ok) {
                                    uploader.uploadProfileHelper(profile, pair);
                                }
                            });
                        });
                    } else {
                        uploader.uploadProfileHelper(profile, keypair);
                    }
                });
            }*/
        },
        uploadProfileHelper: function (profile, keypair) {
            uploader.getDeviceId(function (deviceId) {
                console.log('UploaderProfileHelper');
                /*var gitRepo = "ssh://gitolite3@ts.door43.org:tS/"+deviceId+"/profile";
                //var givenPrivateKey = keypair.private;
                Git.Repository.init(gitRepo, false).then(function(repository){
                    throw new Error(repository);
                });
                var conn = new sshClient();
                conn.connect({
                    host: defaultHost,
                    port: defaultPort,
                    username: 'Emmitt',
                    privateKey: givenPrivateKey
                });*/
            });
        },
        verifyProject: function () {
            //TODO: Implement, returns Boolean
        },
        uploadProject: function () {
            //TODO: Implement, returns void
        },
        getQuestions: function () {
            //TODO: Implement, returns list of question
        },
        updateQuestions: function () {
            //TODO: Implement, returns void
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
        needToRegister: function (callback) {
            jsonfile.readFile(targetFile, function (err, keypair) {
                if (err === null) {
                    //keypair file exists no need to register
                    if (typeof callback === 'function') {
                        callback(false, keypair);
                    }
                } else {
                    //keypair file doesn't exist register
                    if (typeof callback === 'function') {
                        callback(true);
                    }
                }
            });
        },
        getDeviceId: function(callback) {
            getmac.getMac(function(err, mac){
                if (err) {
                    throw new Error('uploader.js could not get a mac address.');
                }
                if (typeof callback === 'function') {
                    callback(mac);
                }
            });

        }
    };

    exports.register = uploader.register;
    exports.disconnect = uploader.disconnect;
    exports.verifyProfile = uploader.verifyProfile;
    exports.uploadProfile = uploader.uploadProfile;
})();
