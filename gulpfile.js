/**
 * translationStudio gulpfile
 *
 * Copyright 2016
 */

const gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    rimraf = require('rimraf'),
    argv = require('yargs').argv,
    packager = require('electron-packager'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    fs = require('fs');

const APP_NAME = 'translationStudio',
    JS_FILES = './src/js/**/*.js',
    UNIT_TEST_FILES = './unit_tests/**/*.js',
    BUILD_DIR = 'build/',
    RELEASE_DIR = 'release/';

gulp.task('test', function () {
    return gulp.src(UNIT_TEST_FILES, { read: false })
        .pipe(mocha({reporter: 'spec', grep: (argv.grep || argv.g)}));
});

gulp.task('clean', function () {
    rimraf.sync('src/logs');
    rimraf.sync('logs');
    rimraf.sync('ssh');
});

// pass parameters like: gulp build --win --osx --linux
gulp.task('build', ['clean'], function (done) {

    var platforms = [];

    if (argv.win) platforms.push('win32');
    if (argv.osx) platforms.push('darwin');
    if (argv.linux) platforms.push('linux');
    if (!platforms.length) platforms.push('win32', 'darwin', 'linux');

    var p = require('./package');
    var ignored = Object.keys(p['devDependencies']).concat([
        'unit_tests',
        'acceptance_tests',
        'out',
        BUILD_DIR,
        RELEASE_DIR,
        'vendor',
        'scripts',
        '\\.'
    ]).map(function (name) {
        return new RegExp('(^/' + name + '|' + '^/node_modules/' + name + ')');
    });

    packager({
        'arch': 'all',
        'platform': platforms,
        'dir': '.',
        'ignore': function (name) {
            for (var i = 0, len = ignored.length; i < len; ++i) {
                if (ignored[i].test(name)) {
                    console.log('\t(Ignoring)\t', name);
                    return true;
                }
            }

            return false;
        },
        'out': BUILD_DIR,
        'app-version': p.version,
        'icon': './icons/icon'
    }, function () {
        console.log('Done building...');
        done();
    });

    // TODO: figure out how to make the builder do this

    // // Adding app icon for linux64
    // if(fs.exists('./build/translationStudio/linux64')) {
    //     fs.stat('./build/translationStudio/linux64', function (err, stats) {
    //         if (stats.isDirectory()) {
    //             // Copy desktop entry to the build folder
    //             var desktopTarget = fs.createWriteStream('./build/translationStudio/linux64/translationStudio.desktop');
    //             var desktopSource = fs.createReadStream('./icons/translationStudio.desktop');
    //             desktopSource.pipe(desktopTarget);

    //             // Copy icon.png file to the build folder
    //             var iconTarget = fs.createWriteStream('./build/translationStudio/linux64/icon.png');
    //             var iconSource = fs.createReadStream('./icons/icon.png');
    //             iconSource.pipe(iconTarget);
    //         }
    //         else {
    //             console.log('Error in accessing linux64 build folder:', err);
    //         }
    //     });
    // }
});

gulp.task('release', function(done) {
    const p = require('./package');
    const archiver = require('archiver');
    const exec = require('child_process').exec;
    const spawn = require('child_process').spawn;

    var promises = [];
    var platforms = [];
    const gitVersion = '2.9.2';

    if (argv.win) platforms.push('win32', 'win64');
    if (argv.win32) platforms.push('win32');
    if (argv.win64) platforms.push('win64');
    if (argv.osx) platforms.push('darwin');
    if (argv.linux) platforms.push('linux');
    if (!platforms.length) platforms.push('win32', 'win64', 'darwin', 'linux');

    /**
     *
     * @param version 2.9.2
     * @param arch 64|32
     * @returns {Promise}
     */
    const downloadGit = function(version, arch) {
        return new Promise(function (resolve, reject) {
            var cmd = `./scripts/git/download_git.sh ./vendor ${version} ${arch}`;
            exec(cmd, function(err, stdout, stderr) {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };

    /**
     *
     * @param arch 64|32
     * @returns {Promise}
     */
    const releaseWin = function(arch) {
        var file = `tS_${p.version}-${p.build}_win_x${arch}.exe`;
        var cmd = `iscc scripts/win_installer_template.iss /DArch=${arch === 64 ? 'x64' : 'x86'} /DRootPath=../ /DVersion=${p.version} /DBuild=${p.build} /DGitVersion=${gitVersion} /DDestFile=${file} /DDestDir=${RELEASE_DIR} /DBuildDir=${BUILD_DIR}`;
        return new Promise(function(resolve, reject) {
            exec(cmd, function(err, stdout, stderr) {
                if(err) {
                    console.error(err);
                    resolve({
                        os: os,
                        status: 'error'
                    });
                } else {
                    resolve({
                        os: 'win' + arch,
                        status: RELEASE_DIR + file
                    });
                }
            });
        });
    };

    mkdirp('release', function() {
        for(var os of platforms) {
            switch (os) {
                case 'win32':
                    if (fs.existsSync(BUILD_DIR + 'translationStudio-win32-ia32/')) {
                        promises.push(downloadGit(gitVersion, '32')
                            .then(releaseWin.bind(undefined, '32')));
                    }
                    break;
                case 'win64':
                    if (fs.existsSync(BUILD_DIR + 'translationStudio-win32-x64/')) {
                        promises.push(downloadGit(gitVersion, '64')
                            .then(releaseWin.bind(undefined, '64')));
                    }
                    break;
                case 'darwin':
                    if (fs.existsSync(BUILD_DIR + 'translationStudio-darwin-x64/')) {
                        promises.push(new Promise(function (os, resolve, reject) {
                            var dest = `${RELEASE_DIR}tS_${p.version}-${p.build}_osx_x64.zip`;
                            try {
                                var output = fs.createWriteStream(dest);
                                output.on('close', function () {
                                    resolve({
                                        os: os,
                                        status: dest
                                    });
                                });
                                var archive = archiver.create('zip');
                                archive.on('error', reject);
                                archive.pipe(output);
                                archive.directory(BUILD_DIR + 'translationStudio-darwin-x64/translationStudio.app/', 'translationStudio.app');
                                archive.finalize();
                            } catch (e) {
                                reject(e);
                            }
                        }.bind(undefined, os)));
                    }
                    break;
                case 'linux':
                    if (fs.existsSync(BUILD_DIR + 'translationStudio-linux-x64/')) {
                        promises.push(new Promise(function (os, resolve, reject) {
                            var dest = `${RELEASE_DIR}tS_${p.version}-${p.build}_linux_x64.zip`;
                            try {
                                var output = fs.createWriteStream(dest);
                                output.on('close', function () {
                                    resolve({
                                        os: os,
                                        status: dest
                                    });
                                });
                                var archive = archiver.create('zip');
                                archive.on('error', reject);
                                archive.pipe(output);
                                archive.directory(BUILD_DIR + 'translationStudio-linux-x64/', 'translationStudio');
                                archive.finalize();
                            } catch (e) {
                                reject(e);
                            }
                        }.bind(undefined, os)));
                    }
                    break;
                default:
                    console.warn('No release procedure has been defined for ' + os);
            }
        }
        Promise.all(promises).then(function(values) {
            for(var release of values) {
                console.log(`${release.os}: ${release.status}`);
            }
            done();
        }).catch(done);
    });
});

gulp.task('default', ['test']);
