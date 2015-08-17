var net = require('net');

;(function () {
    'use strict';

    let authServer = '';
    let authServerPort = '';

    let key = 'ssh-rsa key email@server.com';
    let udid = 'udid';
    let username = '';

    let client;

    let uploader = {
        connect: function (callback) {
            client = net.createConnection({port: authServerPort, host: authServer}, function () {
                let connectionJson = {'key': key, 'udid': udid, 'username': username};
                client.write(JSON.stringify(connectionJson));
            });
            client.on('data', function (data) {
                if (typeof callback === 'function') {
                    callback(data.toString());
                }
                //client.end();
            });
            client.on('end', function () {
                console.log('Disconnected from ' + authServer + ':' + authServerPort);
            });
        },
        disconnect: function () {
            client && client.destroy(), client = null;
        },
        getServerInfo: function () {
            return {'host': authServer, 'port': authServerPort};
        },
        setServerInfo: function (args) {
            if (args.host && args.port) {
                uploader.setHost(args.host);
                uploader.setPort(args.port);
            } else {
                throw new Error('uploader.setServerInfo(args) requires a host and port');
            }
        },
        setHost: function (host) {
            if (host) {
                authServer = host;
            } else {
                throw new Error('uploader.setHost(host) requires a host server');
            }
        },
        setPort: function (port) {
            if (port) {
                authServerPort = port;
            } else {
                throw new Error('uploader.setPort(port) requires a port number');
            }
        }
    };

    exports.connect = uploader.connect;
    exports.disconnect = uploader.disconnect;
    exports.getServerInfo = uploader.getServerInfo;
    exports.setServerInfo = uploader.setServerInfo;
    exports.setHost = uploader.setHost;
    exports.setPort = uploader.setPort;
})();
