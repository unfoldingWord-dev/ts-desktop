/**
 * translationStudio gulpfile
 *
 * Copyright 2015
 */

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    jscs = require('gulp-jscs'),
    map = require('map-stream'),
    argv = require('yargs').argv,
    NwBuilder = require('nw-builder');

var APP_NAME = 'translationStudio',
    JS_FILES = './app/js/**/*.js',
    UNIT_TEST_FILES = './unit_tests/**/*.js';

gulp.task('test', function () {
    return gulp.src(UNIT_TEST_FILES, { read: false })
        .pipe(mocha({reporter: 'spec', grep: (argv.grep || argv.g)}));
});

gulp.task('jscs', function () {
    return gulp.src([JS_FILES, UNIT_TEST_FILES])
        .pipe(jscs({
            fix: !!argv.fix,
            esnext: true,
            configPath: '.jscsrc'
        }))
        .pipe(gulp.dest(function (data) {
            return data.base;
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

gulp.task('build', ['lint', 'test'], function () {

    var nw = new NwBuilder({
        files: './app/**/**', // use the glob format
        platforms: ['osx64', 'win64'],
        appName: APP_NAME
    });

    nw.build().then(function () {
        console.log('all done! everything is in ./build');
    }).catch(console.error.bind(console, 'there was an error building...'));
});

gulp.task('default', [/*'lint',*/ 'test']);
