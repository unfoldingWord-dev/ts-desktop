/**
 * Created by Chris on 7/23/2015.
 */

//var fs = require('fs');
var mkdirp = require('mkdirp');
var utils = require('./lib/utils');
var setPath = utils.setPath;
var jsonfile = require('jsonfile');
var md5 = require('md5');

function User (args) {
    'use strict';

    var _this = this;
    var profilesDirectory = args.profilesDirectory;
    var username = args.username;
    var password = args.password;
    var hash = md5(username);

    if (username === '' || username === null) {
        throw 'Must supply a username';
    }

    var targetDirectory = 'translationStudio/profiles/' + hash + '/';
    var targetFile = profilesDirectory + targetDirectory + 'profile.json';
    var storage = {
        'username': username,
        'password': password,
        'profile': profilesDirectory,
        'email': '',
        'name': '',
        'phone': ''
    };

    jsonfile.readFile(targetFile, function (err, obj) {
        if (err) {
            mkdirp(setPath(targetDirectory, profilesDirectory));
            jsonfile.writeFile(targetFile, storage, function (err) {
                if (err) {
                    throw new Error(err.message);
                }
            });
        } else {
            storage = obj;
        }
    });

    _this.setEmail = function (email) {
        storage.email = email;
    };

    _this.setName = function (name) {
        storage.name = name;
    };

    _this.setPhone = function (phone) {
        storage.phone = phone;
    };

    _this.getEmail = function () {
        return storage.email;
    };

    _this.getName = function () {
        return storage.name;
    };

    _this.getPhone = function () {
        return storage.phone;
    };

    _this.commit = function () {
        var success = true;
        jsonfile.writeFile(targetFile, storage, function (err) {
            if (err) {
                success = false;
                throw new Error(err.message);
            }
        });
        return success;
    };

}

exports.instance = User;
