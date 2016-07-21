/**
 * translationStudio gulpfile
 *
 * Copyright 2016
 */

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    rimraf = require('rimraf'),
    argv = require('yargs').argv,
    packager = require('electron-packager'),
    path = require('path'),
    fs = require('fs');

var APP_NAME = 'translationStudio',
    JS_FILES = './src/js/**/*.js',
    UNIT_TEST_FILES = './unit_tests/**/*.js',
    BUILD_DIR = 'out';

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
        'out': 'out',
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

gulp.task('default', ['test']);
