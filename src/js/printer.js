'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    utils = require('../js/lib/utils'),
    AdmZip = require('adm-zip'),
    https = require('https'),
    mkdirp = require('mkdirp'),
    os = require('os'),
    princePackager = require('../js/prince-packager'),
    Prince = require('prince');

function PrintManager(configurator) {

    var download = utils.download;
    var srcDir = path.resolve(path.join(__dirname, '..'));
    var imageRoot = path.join(configurator.getValue('rootdir'), 'images');
    var imagePath = path.join(imageRoot, 'obs');
    var zipPath = path.join(imageRoot, 'obs-images.zip');
    var server = "https://api.unfoldingword.org/";
    var url = server + 'obs/jpg/1/en/obs-images-360px.zip';

    return {

        downloadImages: function () {
            return utils.fs.mkdirs(imagePath)
                .then(function () {
                    return utils.fs.stat(zipPath).then(utils.ret(true)).catch(utils.ret(false));
                })
                .then(function (fileExists) {
                    return fileExists ? true : download(url, zipPath, true);
                });
        },

        extractImages: function () {
            var zip = new AdmZip(zipPath);
            zip.extractAllTo(imagePath, true);

            var directories = fs.readdirSync(imagePath).filter(function (file) {
                return fs.statSync(path.join(imagePath, file)).isDirectory();
            });
            directories.forEach(function (dir) {
                var dirPath = path.join(imagePath, dir);
                var files = fs.readdirSync(dirPath);
                files.forEach(function (file) {
                    var filePath = path.join(imagePath, dir, file);
                    var newPath = path.join(imagePath, file);
                    fs.renameSync(filePath, newPath);
                });
                fs.rmdirSync(dirPath);
            });
        },

        savePdf: function (title, license, body, filePath, direction) {
            var fontSizeMap = {
                'small': '50%',
                'normal': '100%',
                'large': '150%'
            };
            var tempPath = configurator.getValue('tempDir');
            var input = path.join(tempPath, 'print.html');
            var cssPath = path.join(srcDir, 'css', 'print.css');
            var font = configurator.getUserSetting('targetfont').name;
            var sizeValue = configurator.getUserSetting('targetsize').name.toLowerCase();
            var size = fontSizeMap[sizeValue];
            var mainheader = '\<!DOCTYPE html\>\<html\>\<head\>\<link rel="stylesheet" href="' + cssPath + '"\>\<\/head\>\<body\>';
            var mainfooter = '\<\/body\>\<\/html\>';
            var titlegroup = '\<h1 id="title" class="break titles" style="font-family: ' + font + ';"\>' + title + '\<\/h1\>';
            var licensegroup = '\<div id="license" class="break"\>' + license + '\<\/div\>';
            var bodygroup = '\<div id="textholder" style="direction: ' + direction + '; font-family: ' + font + '; font-size: ' + size + ';"\>' + body + '\<\/div\>';

            var princeInfo = princePackager.info(os.platform());

            mkdirp.sync(tempPath);
            fs.writeFileSync(input, mainheader + titlegroup + licensegroup + bodygroup + mainfooter);

            return Prince()
                .binary(path.join(srcDir, 'prince', princeInfo.binary))
                .prefix(path.join(srcDir, 'prince', princeInfo.prefix))
                .inputs(input)
                .output(filePath)
                .execute()
                .catch(function (err) {
                    return utils.fs.remove(tempPath)
                        .then(function () {
                            if (err.stderr.includes("Permission denied")) {
                                throw "Cannot write to file. It may already be open.";
                            } else {
                                console.log(err);
                                throw "There was a problem creating the file."
                            }
                        });
                })
                .then(function () {
                    return utils.fs.remove(tempPath);
                });

        },

        getLicense: function (filename) {
            return fs.readFileSync(path.join(srcDir, 'assets', filename), 'utf8');
        }
    };
}

module.exports.PrintManager = PrintManager;
