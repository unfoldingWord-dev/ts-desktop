/**
 * Created by Chris on 7/23/2015.
 */

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

    if (username === '' || username === null) {
        throw new Error('Must supply a valid username');
    }

    var hash = md5(username);
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
        if (err === null) {
            storage = obj;
        } else {
            mkdirp(setPath(targetDirectory, profilesDirectory), function () {
                _this.saveData();
            });
        }
    });

    _this.saveData = function () {
        try {
            jsonfile.writeFileSync(targetFile, storage);
        } catch (e) {
            throw new Error('Could not write to file');
        }
        return true;
    };

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
        return _this.saveData();
    };

}

exports.instance = User;
