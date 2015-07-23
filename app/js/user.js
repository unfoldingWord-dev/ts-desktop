/**
 * Created by Chris on 7/23/2015.
 */

var fs = require('fs');
var os = require('os');
var https = require('https');
var mkdirp = require('mkdirp');

function User (args) {
    'use strict';

    var _this = this;
    var profilesDirectory = args.profilesDirectory;
    var username = args.username;
    var password = args.password;

    //code goes here to create and load initial user profile

    _this.setEmail = function (string) {

    };

    _this.setName = function (string) {

    };

    _this.setPhone = function (string) {

    };

    _this.getEmail = function () {

        return string;
    };

    _this.getName = function () {

        return string;
    };

    _this.getPhone = function () {

        return string;
    };

    _this.commit = function () {

        return bool;
    };

}

exports.instance = User;
