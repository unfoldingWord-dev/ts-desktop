module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    curl: {
      'get-nw': {
        src: 'http://dl.node-webkit.org/v0.11.6/node-webkit-v0.11.6-win-x64.zip',
        dest: '.bin/node-webkit/win64.zip'
      }
    }
  });

  // Load in `grunt-curl`
  grunt.loadNpmTasks('grunt-curl');

  grunt.registerTask('default', 'do some stuff', function() {
    var fs = require('fs');
    var AdmZip = require('adm-zip');
    var Download = require('download');

    if(!fs.existsSync('.bin/node-webkit/win64.zip')) {
      grunt.log.write('downloading node-webkit...');

      var download = new Download({ extract: true, strip: 1, mode: '755' })
          .get('http://dl.node-webkit.org/v0.11.6/node-webkit-v0.11.6-win-x64.zip')
          .dest('.bin/node-webkit/');

      download.run(function (err, files) {
      if (err) {
          throw err;
      }

      grunt.log.write('File downloaded successfully!');
    });

      grunt.log.ok();
      // TODO: extract zip
    }

    if(!fs.existsSync('.bin/node-webkit/node-webkit-v0.11.6-win-x64')) {
      grunt.log.write('extracting node-webkit...');
      var zip = new AdmZip('.bin/node-webkit/win64.zip');
      zip.extractAllTo('.bin/node-webkit', true);
      grunt.log.ok();
    }

  });
};
