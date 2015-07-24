/**
 * Created by Chris on 7/23/2015.
 */

var fs = require('fs');
var mkdirp = require('mkdirp');

function User (args) {
    'use strict';

    var _this = this;
    var profilesDirectory = args.profilesDirectory;  //Users local file location ex: C:\Users\Chris\
    var username = args.username; //add validation to make sure there is a username
    var password = args.password;
    var hash = md5(username); //this function does not work without loading a module for it
    var targetDirectory = profilesDirectory + "translationStudio/profiles/" + hash;
    var targetFile = targetDirectory + "/profile.json";
    var storage = {
        "username": username,
        "password": password,
        "email": "",
        "name": "",
        "phone": ""
    };

    try {
        var stats = fs.lstatSync(targetFile);
        if(stats.isFile()) {
            fs.readFile(targetFile, function read(err, data) {
                if (err) {
                    throw err;
                }
                storage = data;
            });
        } else {
            mkdirp(targetDirectory, function (e) {
                if (e) {
                    throw new Error(e);
                }
            });
            fs.writeFile(targetFile, storage, function(err) {
                if(err) {
                    throw new Error(err.message);
                }
            });
        }
    } catch (e) {

    }

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
        fs.writeFile(targetFile, storage, function(err) {
            if(err) {
                success = false;
                throw new Error(err.message);
            }
        });
        return success;
    };

}

exports.instance = User;
