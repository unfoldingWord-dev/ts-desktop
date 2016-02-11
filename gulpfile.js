/**
 * translationStudio gulpfile
 *
 * Copyright 2016
 */

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    jscs = require('gulp-jscs'),
    rimraf = require('rimraf'),
    map = require('map-stream'),
    argv = require('yargs').argv,
    NwBuilder = require('nw-builder');

var fs = require('fs');

var APP_NAME = 'translationStudio',
    JS_FILES = './src/js/**/*.js',
    UNIT_TEST_FILES = './unit_tests/**/*.js';

gulp.task('test', function () {
    return gulp.src(UNIT_TEST_FILES, { read: false })
        .pipe(mocha({reporter: 'spec', grep: (argv.grep || argv.g)}));
});

gulp.task('jscs', function () {
    return gulp.src([JS_FILES, UNIT_TEST_FILES])
        .pipe(jscs({
            esnext: true,
            configPath: '.jscsrc'
        }));
});

/*
 * Force the JSHint task to tank when there's an "error".
 * http://stackoverflow.com/questions/27852814/gulp-jshint-how-to-fail-the-build
 * 'Cause we're strict like that.
 */
var exitOnJshintError = map(function (file, cb) {
    if (!file.jshint.success) {
        console.error('jshint failed');
        process.exit(1);
    }
});

gulp.task('jshint', function () {
    return gulp.src([JS_FILES, UNIT_TEST_FILES])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(exitOnJshintError);
});

gulp.task('lint', [
    'jscs',
    'jshint'
]);

// pass parameters like: gulp build --win --osx --linux
gulp.task('build', [], function () {
    // clean out extra files
    rimraf.sync('src/logs');
    rimraf.sync('src/ssh');

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

    var nw = new NwBuilder({
        files: [
            './src/**/**',
            './node_modules/**/**'
        ],
        platforms: platforms,
        version: '0.12.3',
        appName: APP_NAME,
        winIco: './icons/icon.ico',
        macIcns: './icons/icon.icns'
    });

    nw.build().then(function () {
        // Adding app icon for linux64
        if(fs.exists('./build/translationStudio/linux64')) {
            fs.stat('./build/translationStudio/linux64', function (err, stats) {
                if (stats.isDirectory()) {
                    // Copy desktop entry to the build folder
                    var desktopTarget = fs.createWriteStream('./build/translationStudio/linux64/translationStudio.desktop');
                    var desktopSource = fs.createReadStream('./icons/translationStudio.desktop');
                    desktopSource.pipe(desktopTarget);

                    // Copy icon.png file to the build folder
                    var iconTarget = fs.createWriteStream('./build/translationStudio/linux64/icon.png');
                    var iconSource = fs.createReadStream('./icons/icon.png');
                    iconSource.pipe(iconTarget);
                }
                else {
                    console.log('Error in accessing linux64 build folder:', err);
                }
            });
        }

        console.log('all done! everything is in ./build');
    }).catch(console.error.bind(console, 'there was an error building...'));
});

gulp.task('default', ['lint', 'test']);
