/**
 * translationStudio gulpfile
 *
 * Copyright 2015
 */

var gulp = require('gulp'),
    NwBuilder = require('nw-builder'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    jscs = require('gulp-jscs');

var APP_NAME = 'translationStudio',
    JS_FILES = './app/js/**/*.js';
    
gulp.task('jscs', function () {
    return gulp.src(JS_FILES)
        .pipe(jscs({
            fix: true,
            esnext: true,
            configPath: '.jscsrc'
        }))
        .pipe(gulp.dest(function (data) {
            return data.base;
        }));
})

gulp.task('jshint', function () {
    return gulp.src(JS_FILES)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('fail'));
});

gulp.task('lint', [
    'jscs',
    'jshint'
]);

gulp.task('build', ['lint'], function () {
  
    var nw = new NwBuilder({
        files: './app/**/**', // use the glob format
        platforms: ['osx64', 'win64'],
        appName: APP_NAME
    });

    nw.build().then(function() {
        console.log('all done! everything is in ./build');
    }).catch(console.error.bind(console, 'there was an error building...'));
});

gulp.task('default', ['build']);