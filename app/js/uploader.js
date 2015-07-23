/**
 * Created by Emmitt on 7/23/2015.
 */
var net = require('net');
var os = require('os');

var authServer = '';
var authServerPort = '';

var key = 'ssh-rsa key email@server.com';
var udid = 'udid';
var username = 'emmitt';

var uploader = {
    connect: function(){
        var client = net.createConnection({port: authServerPort, host: authServer}, function(){
            var connectionJson = {'key': key, 'udid': udid, 'username': username};
            var ok = client.write(JSON.stringify(connectionJson));
        });
        client.on('data', function(data) {
            console.log(data.toString());
            //client.end();
        });
        client.on('end', function() {
            console.log('Disconnected from ' + authServer + ':' + authServerPort);
        });
    },
    getServerInfo: function(){
        return {'host': authServer, 'port': authServerPort};
    },
    setServerInfo: function(args){
        if(args.host && args.port){
            uploader.setHost(args.host);
            uploader.setPort(args.port);
        }
        else{
            throw new Error('uploader.setServerInfo(args) requires a host and port')
        }
    },
    setHost: function(host){
        if(host){
            authServer = host;
        }
        else{
            throw new Error('uplodaer.setHost(host) requires a host server');
        }
    },
    setPort: function (port) {
        if(port){
            authServerPort = port;
        }
        else{
            throw new Error('uplodaer.setPort(port) requires a port number');
        }
    }
};

exports.connect = uploader.connect;
exports.getServerInfo = uploader.getServerInfo;
exports.setServerInfo = uploader.setServerInfo;
exports.setHost = uploader.setHost;
exports.setPort = uploader.setPort;
