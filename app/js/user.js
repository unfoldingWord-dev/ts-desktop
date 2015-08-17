'use strict';

;(function () {

    let mkdirp = require('mkdirp');
    let jsonfile = require('jsonfile');
    let path = require('path');
    let md5 = require('md5');
    let fs = require('fs');

    function User (args) {
        let profilesDirectory = args.profilesDirectory;
        let username = args.username;
        let password = args.password;

        if (username === '' || username === null) {
            throw new Error('Must supply a valid username');
        }

        let hash = md5(username);
        let targetDirectory = 'translationStudio/profiles/' + hash + '/';
        let targetFile = path.join(profilesDirectory, targetDirectory, 'profile.json');
        let storage = {
            'username': username,
            'password': password,
            'profile': profilesDirectory,
            'email': '',
            'name': '',
            'phone': ''
        };

        function saveData () {
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
                let dir = path.join(profilesDirectory, targetDirectory);
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
