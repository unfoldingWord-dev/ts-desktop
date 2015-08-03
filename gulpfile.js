/**
 * translationStudio gulpfile
 *
 * Copyright 2015
 */

var gulp = require('gulp');
var NwBuilder = require('nw-builder');

var APP_NAME = 'translationStudio';

gulp.task('build', function() {
  
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