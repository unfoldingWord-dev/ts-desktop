// IMPORTANT! this requires prince (npm module) v1.3.0

'use strict';
let path = require('path'),
    mkdirp = require('mkdirp'),
    fs = require('fs-extra'),
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
function install(dir, os) {
    if(typeof dir === 'undefined') return Promise.reject('Missing dir parameter');

    let destdir = path.join(dir, os);
    mkdirp.sync(dir);
    let tempfile = path.join(dir, 'prince-'+ os +'.download');
    let url = '';

    if(os === 'win') {
        url = 'http://www.princexml.com/download/prince-14-win32.zip';
        tempfile += ".zip";
    } else if(os === 'osx') {
        url = 'http://www.princexml.com/download/prince-14-macosx.tar.gz';
        tempfile += ".tar.gz";
    } else if(os === 'linux') {
        url = 'http://www.princexml.com/download/prince-14-linux-generic-x86_64.tar.gz';
        tempfile += ".tar.gz";
    } else {
        return Promise.reject('Missing or invalid os parameter');
    }

    return download(url)
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
            try {
                let dirs = fs.readdirSync(destdir);
                if (dirs.length === 1) {
                    // strip parent directory
                    console.log('Removing parent dir ' + dirs[0]);
                    console.log(dirs[0]);
                    let parentDir = path.join(destdir, dirs[0]);
                    let promises = [];
                    for(let file of fs.readdirSync(parentDir)) {
                        let p = new Promise(function(resolve, reject) {
                            fs.move(path.join(parentDir, file), path.join(destdir, file), {clobber: true}, function(err) {
                                if(err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                        promises.push(p);
                    }
                    return Promise.all(promises)
                        .then(function() {
                            try {
                                fs.removeSync(parentDir);
                            } catch (err) {
                                return Promise.reject(err);
                            }
                            return Promise.resolve();
                        });
                }
            } catch (err) {
                console.log(err);
                return Promise.reject(err);
            }
        })
        .then(function() {
            // cleanup
            console.log('Prince has been installed for ' + os);
            fs.unlinkSync(tempfile);
            return Promise.resolve();
        })
        .catch(function(err) {
            console.log(err);
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
 * Returns relative paths to prince files for the given os.
 * These paths are relative to the install directory.
 *
 * @param os {string} the operating system for whom prince info will be returned
 * @returns {array}
 */
function info(os) {
    let princeDir = '';
    let princePrefix = '';
    let princeBinary = '';
    if(/^win/.test(os)) {
        princeDir = 'win';
        princePrefix = princeDir;
        princeBinary = path.join(princePrefix, 'bin', 'prince.exe');
    } else if(/^darwin/.test(os)) {
        princeDir = 'osx';
        princePrefix = path.join(princeDir, 'lib', 'prince');
        princeBinary = path.join(princePrefix, 'bin', 'prince');
    } else if(/^linux/.test(os)) {
        princeDir = 'linux';
        princePrefix = path.join(princeDir, 'lib', 'prince');
        princeBinary = path.join(princePrefix, 'bin', 'prince');
    }
    return {
        dir: princeDir,
        prefix: princePrefix,
        binary: princeBinary
    }
}

module.exports.install = install;
module.exports.info = info;
