// IMPORTANT! this requires prince (npm module) v1.3.0

'use strict';
let path = require('path'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    zlib = require("zlib"),
    child_process = require("child_process"),
    request = require('request'),
    progress = require("progress"),
    AdmZip = require('adm-zip'),
    tar = require('tar');

/**
 * Downloads a prince executable and installs it locally
 * @param os string the operating system to download for
 * @param dir string the installation directory
 * @returns {Promise}
 */
function install(os, dir) {
    if(typeof dir === 'undefined') return Promise.reject('Missing dir parameter');

    let destdir = path.join(dir, os);
    mkdirp.sync(dir);
    let tempfile = path.join(dir, 'prince-'+ os +'.download');
    let destfile = '';
    let url = '';

    if(os === 'win') {
        url = 'http://www.princexml.com/download/prince-11-win32.zip';
        tempfile += ".zip";
    } else if(os === 'osx') {
        url = 'http://www.princexml.com/download/prince-11-macosx.tar.gz';
        tempfile += ".tar.gz";
    } else if(os === 'linux') {
        url = 'http://www.princexml.com/download/prince-11-linux-generic-x86_64.tar.gz';
        tempfile += ".tar.gz";
    } else {
        return Promise.reject('Missing or invalid os parameter');
    }

    let prom = Promise.resolve();
    if(!fileExists(tempfile)) {
        prom = download(url);
    } else {
        console.log('Using cached download');
    }
    return prom
        .then(function(data) {
            fs.writeFileSync(tempfile, data, { encoding: null });

            if(/\.zip$/.test(tempfile)) {
                return extractZipball(tempfile, destdir, 1);
            } else if(/\.tar\.gz/.test(tempfile)) {
                return extractTarball(tempfile, destdir, 1);
            } else {
                return Promise.reject('Unknown file extension on ' + tempfile);
            }
        })
        .then(function() {
            console.log('Prince has been installed for ' + os);
            return Promise.resolve();
        })
        .catch(function(err) {
            console.log('Failed to install prince for ' + os);
            fs.unlinkSync(tempfile);
            return Promise.reject(err);
        });

}

/**
 * Extracts a zipball (*.zip)
 * @param zipball
 * @param destdir
 * @returns {Promise}
 */
function extractZipball(zipball, destdir) {
    return new Promise(function(resolve, reject) {
        let zip = new AdmZip(zipball);
        try {
            zip.extractAllTo(destdir);
            resolve();
        } catch(err) {
            reject(err);
        }
    });
}

/**
 * extract a tarball (*.tar.gz)
 * @param tarball
 * @param destdir
 * @param stripdirs
 */
function extractTarball (tarball, destdir, stripdirs) {
    return new Promise(function (resolve, reject) {
        fs.createReadStream(tarball)
            .pipe(zlib.createGunzip())
            .pipe(tar.Extract({ path: destdir, strip: stripdirs }))
            .on("error", function (error) { reject(error); })
            .on("end", function () { resolve(); });
    });
}
//
// function installExe(exe, destdir) {
//     if(/win/.test(process.platform)) {
//         return new Promise(function(resolve, reject) {
//             console.log('Installing natively...');
//             let args = ["/s", "/a", "/vTARGETDIR=\"" + path.resolve(destdir) + "\" /qn"];
//             child_process.execFile(exe, args, function (error, stdout, stderr) {
//                 if (error !== null) {
//                     console.log("** ERROR: failed to extract: " + error);
//                     stdout = stdout.toString();
//                     stderr = stderr.toString();
//                     // if (stdout !== "")
//                     //     console.log("** STDOUT: " + stdout);
//                     // if (stderr !== "")
//                     //     console.log("** STDERR: " + stderr);
//                     reject(stderr + '; ' + stdout);
//                 }
//                 else {
//                     // fs.unlinkSync(destfile);
//                     console.log("-- OK: local PrinceXML installation now available");
//                     resolve();
//                 }
//             });
//         });
//     } else if(/linux/.test(process.platform)) {
//         return new Promise(function(resolve, reject) {
//             console.log('Testing for wine...');
//             child_process.exec('wine --version', function(error, stdout, stderr) {
//                 if(error !== null) {
//                     installWine()
//                         .then(resolve)
//                         .catch(reject);
//                 } else {
//                     resolve();
//                 }
//             });
//         }).then(function() {
//             return installExeWithWine(exe, destdir);
//         });
//     } else {
//         return Promise.reject('You are on your own. Sorry! Try running this on linux.');
//     }
// }
//
// function installExeWithWine(exe, destdir) {
//     return new Promise(function(resolve, reject) {
//         console.log('installing exe with wine...');
//         // TODO: this should work... but it's not
//         let cmd = 'wine ' + path.resolve(exe) + ' /s /a /vTARGETDIR="C:\\Prince" /qn';
//         child_process.exec(cmd, function(error, stdout, stderr) {
//             if(error !== null) {
//                 reject(error);
//             } else {
//                 resolve();
//             }
//         });
//     });
// }
//
// function installWine() {
//     return new Promise(function(resolve, reject) {
//         console.log('Installing wine');
//         child_process.exec('sudo add-apt-repository --yes ppa:ubuntu-wine/ppa && sudo apt-get install -y -q wine ', function(error, stdout, stderr) {
//             if(error !== null) {
//                 reject(stdout);
//             } else {
//                 resolve();
//             }
//         });
//     });
// }

/**
 * Downloads a file
 * @param url
 * @returns {Promise}
 */
function download(url) {
    return new Promise(function (resolve, reject) {
        console.log('downloading...');
        let options = {
            method: "GET",
            url: url,
            encoding: null,
            headers: {
                "User-Agent": "node-prince (prince-npm.js:install)"
            }
        };
        (new Promise(function (resolve /*, reject  */) {
            if (typeof process.env.http_proxy === "string" && process.env.http_proxy !== "") {
                options.proxy = process.env.http_proxy;
                console.log("-- using proxy ($http_proxy): " + options.proxy);
                resolve();
            }
            else {
                child_process.exec("npm config get proxy", function (error, stdout /*, stderr */) {
                    if (error === null) {
                        stdout = stdout.toString().replace(/\r?\n$/, "");
                        if (stdout.match(/^https?:\/\/.+/)) {
                            options.proxy = stdout;
                            console.log("-- using proxy (npm config get proxy): " + options.proxy);
                        }
                    }
                    resolve();
                });
            }
        })).then(function () {
            console.log("-- download: " + url);
            let req = request(options, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    console.log("-- download: " + body.length + " bytes received.");
                    resolve(body);
                }
                else
                    reject("download failed: " + error);
            });
            let progress_bar = null;
            req.on("response", function (response) {
                let len = parseInt(response.headers["content-length"], 10);
                progress_bar = new progress(
                    "-- download: [:bar] :percent (ETA: :etas)", {
                        complete:   "#",
                        incomplete: "=",
                        width:      40,
                        total:      len
                    });
            });
            req.on("data", function (data) {
                if (progress_bar !== null)
                    progress_bar.tick(data.length);
            });
        });
    });
}

/**
 * Checks if a file exists.
 *
 * @param file {string}
 * @returns {boolean}
 */
function fileExists(file) {
    try {
        fs.statSync(file);
        return true;
    } catch(err) {
        return false;
    }
}

module.exports.install = install;
