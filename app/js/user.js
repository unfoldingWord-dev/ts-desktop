var mkdirp = require('mkdirp');
var jsonfile = require('jsonfile');
var path = require('path');
var md5 = require('md5');
var fs = require('fs');

;(function () {
    'use strict';

    function User(args) {
        var profilesDirectory = args.profilesDirectory;
        var username = args.username;
        var password = args.password;

        if (username === '' || username === null) {
            throw new Error('Must supply a valid username');
        }

        var hash = md5(username);
        var targetDirectory = 'translationStudio/profiles/' + hash + '/';
        var targetFile = path.join(profilesDirectory, targetDirectory, 'profile.json');
        var storage = {
            'username': username,
            'password': password,
            'profile': profilesDirectory,
            'email': '',
            'name': '',
            'phone': ''
        };

        function saveData() {
            try {
                jsonfile.writeFileSync(targetFile, storage);
            } catch (e) {
                throw new Error('Could not write to file');
            }
            return true;
        }

        jsonfile.readFile(targetFile, function (err, obj) {
            if (err === null) {
                storage = obj;
            } else {
                mkdirp(path.join(profilesDirectory, targetDirectory), function () {
                    saveData();
                });
            }
        });


        let user = {
            setEmail: function (email) {
                storage.email = email;
            },
            setName: function (name) {
                storage.name = name;
            },
            setPhone: function (phone) {
                storage.phone = phone;
            },
            getEmail: function () {
                return storage.email;
            },
            getName: function () {
                return storage.name;
            },
            getPhone: function () {
                return storage.phone;
            },
            commit: function () {
                return saveData();
            },
            destroy: function () {
                var dir = path.join(profilesDirectory, targetDirectory);
                if (fs.existsSync(targetFile)) {
                    fs.unlinkSync(targetFile);
                }
                if (fs.existsSync(dir)) {
                    fs.rmdirSync(dir);
                }
            },
            getProfilePath: function () {
                return targetFile;
            }
        };
        return user;
    }

    exports.User = User;
}());
