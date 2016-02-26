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
    if(argv.win !== undefined) {
        platforms = ['win64', 'win32'];
    } else if(argv.osx !== undefined) {
        platforms = ['osx64'];
    } else if(argv.linux !== undefined) {
        platforms = ['linux64', 'linux32'];
    } else {
        platforms = ['osx64', 'win64', 'linux64'];
    }

    var p = require('./package');
    var ignored = Object.keys(p['devDependencies']).concat([
        'unit_tests',
        'acceptance_tests',
        'out',
        'scripts',
        '\\.'
    ]).map(function (name) {
        return new RegExp('(^/' + name + '|' + '^/node_modules/' + name + ')');
    });

    packager({
        all: true,
        dir: '.',
        ignore: function (name) {
            for (var i = 0, len = ignored.length; i < len; ++i) {
                if (ignored[i].test(name)) {
                    console.log('\t(Ignoring)\t', name);
                    return true;
                }
            }

            return false;
        },
        out: 'out'
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
