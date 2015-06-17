/**
 * translationStudio Gruntfile
 *
 * Copyright 2015
 */

module.exports = function (grunt) {
  'use strict';

  // load all grunt tasks
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  // configurable paths
  var config = {
    app: 'app',
    dist: 'dist'
  };

  grunt.initConfig({
    config: config,
    
    nodewebkit: {
      options: {
          platforms: ['win', 'osx'],
          buildDir: '<%= config.dist %>' // Where the build version of my node-webkit app is saved
      },
      
      src: ['<%= config.app %>/**/*', '!<%= config.app %>/**/*.{scss,sass}'] // Your node-webkit app
    },
    
    watch: {
      sass: {
        files: [
          '<%= config.app %>/css/{,*/}*.{scss,sass}',
          '<%= config.app %>/elements/{,*/}*.{scss,sass}'
        ],
        
        tasks: ['sass']
      }
    },
    
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      
      files: '<%= config.app %>/js/*.js'
    },
    
    sass: {
      options: {
        sourceMap: true
      },
      
      dist: {
        files: [{
          expand: true,
          cwd: '<%= config.app %>',
          src: ['css/{,*/}*.{scss,sass}', 'elements/{,*/}*.{scss,sass}'],
          dest: '<%= config.app %>',
          ext: '.css'
        }]
      }
    }
  });
  
  grunt.registerTask('check', [
    'jshint'
  ]);
  
  grunt.registerTask('dist', [
    'check',
    'sass',
    'nodewebkit'
  ]);
  
  grunt.registerTask('default', ['dist']);
};
