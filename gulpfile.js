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

var fs = require('fs');

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
            './app/**/**',
            './node_modules/ansi-regex/**',
            './node_modules/ansi-styles/**',
            './node_modules/asn1/**',
            './node_modules/assert-plus/**',
            './node_modules/async/**',
            './node_modules/aws-sign2/**',
            './node_modules/balanced-match/**',
            './node_modules/bl/**',
            './node_modules/boom/**',
            './node_modules/brace-expansion/**',
            './node_modules/buffer-to-vinyl/**',
            './node_modules/builtin-modules/**',
            './node_modules/camelcase/**',
            './node_modules/camelcase-keys/**',
            './node_modules/caseless/**',
            './node_modules/chalk/**',
            './node_modules/charenc/**',
            './node_modules/charm/**',
            './node_modules/cliui/**',
            './node_modules/clone/**',
            './node_modules/clone-stats/**',
            './node_modules/co/**',
            './node_modules/code-point-at/**',
            './node_modules/combined-stream/**',
            './node_modules/commander/**',
            './node_modules/concat-map/**',
            './node_modules/concat-stream/**',
            './node_modules/core-util-is/**',
            './node_modules/crypt/**',
            './node_modules/cryptiles/**',
            './node_modules/ctype/**',
            './node_modules/decamelize/**',
            './node_modules/decompress/**',
            './node_modules/decompress-tar/**',
            './node_modules/decompress-tarbz2/**',
            './node_modules/decompress-targz/**',
            './node_modules/decompress-unzip/**',
            './node_modules/deep-extend/**',
            './node_modules/defaults/**',
            './node_modules/delayed-stream/**',
            './node_modules/download/**',
            './node_modules/download-status/**',
            './node_modules/duplexer/**',
            './node_modules/duplexer2/**',
            './node_modules/duplexify/**',
            './node_modules/each-async/**',
            './node_modules/end-of-stream/**',
            './node_modules/error-ex/**',
            './node_modules/escape-string-regexp/**',
            './node_modules/extend/**',
            './node_modules/extract-opts/**',
            './node_modules/fd-slicer/**',
            './node_modules/file-exists/**',
            './node_modules/file-type/**',
            './node_modules/find-index/**',
            './node_modules/find-up/**',
            './node_modules/first-chunk-stream/**',
            './node_modules/forever-agent/**',
            './node_modules/form-data/**',
            './node_modules/fs-readfile-promise/**',
            './node_modules/gaze/**',
            './node_modules/generate-function/**',
            './node_modules/generate-object-property/**',
            './node_modules/get-stdin/**',
            './node_modules/getmac/**',
            './node_modules/glob/**',
            './node_modules/glob-stream/**',
            './node_modules/glob-watcher/**',
            './node_modules/glob2base/**',
            './node_modules/globule/**',
            './node_modules/graceful-fs/**',
            './node_modules/graceful-readlink/**',
            './node_modules/gulp-rename/**',
            './node_modules/har-validator/**',
            './node_modules/has-ansi/**',
            './node_modules/hawk/**',
            './node_modules/hoek/**',
            './node_modules/hosted-git-info/**',
            './node_modules/http-signature/**',
            './node_modules/indent-string/**',
            './node_modules/inflight/**',
            './node_modules/inherits/**',
            './node_modules/ini/**',
            './node_modules/invert-kv/**',
            './node_modules/ip-regex/**',
            './node_modules/is-absolute/**',
            './node_modules/is-arrayish/**',
            './node_modules/is-buffer/**',
            './node_modules/is-builtin-module/**',
            './node_modules/is-bzip2/**',
            './node_modules/is-finite/**',
            './node_modules/is-fullwidth-code-point/**',
            './node_modules/is-gzip/**',
            './node_modules/is-integer/**',
            './node_modules/is-my-json-valid/**',
            './node_modules/is-natural-number/**',
            './node_modules/is-property/**',
            './node_modules/is-relative/**',
            './node_modules/is-tar/**',
            './node_modules/is-utf8/**',
            './node_modules/is-zip/**',
            './node_modules/isarray/**',
            './node_modules/isstream/**',
            './node_modules/json-stringify-safe/**',
            './node_modules/jsonpointer/**',
            './node_modules/jsonfile/**',
            './node_modules/lcid/**',
            './node_modules/load-json-file/**',
            './node_modules/lodash/**',
            './node_modules/longest/**',
            './node_modules/loud-rejection/**',
            './node_modules/lpad/**',
            './node_modules/lpad-align/**',
            './node_modules/lru-cache/**',
            './node_modules/map-obj/**',
            './node_modules/md5/**',
            './node_modules/meow/**',
            './node_modules/merge/**',
            './node_modules/merge-stream/**',
            './node_modules/mime-db/**',
            './node_modules/mime-types/**',
            './node_modules/minimatch/**',
            './node_modules/minimist/**',
            './node_modules/mkdirp/**',
            './node_modules/moment/**',
            './node_modules/multimeter/**',
            './node_modules/node-dir/**',
            './node_modules/node-uuid/**',
            './node_modules/normalize-package-data/**',
            './node_modules/number-is-nan/**',
            './node_modules/nw/**',
            './node_modules/oauth-sign/**',
            './node_modules/object-assign/**',
            './node_modules/once/**',
            './node_modules/onetime/**',
            './node_modules/ordered-read-streams/**',
            './node_modules/os-locale/**',
            './node_modules/parse-json/**',
            './node_modules/path-exists/**',
            './node_modules/path-is-absolute/**',
            './node_modules/path-type/**',
            './node_modules/pend/**',
            './node_modules/pify/**',
            './node_modules/pinkie/**',
            './node_modules/pinkie-promise/**',
            './node_modules/process-nextick-args/**',
            './node_modules/progress/**',
            './node_modules/qs/**',
            './node_modules/rc/**',
            './node_modules/read-all-stream/**',
            './node_modules/read-pkg/**',
            './node_modules/read-pkg-up/**',
            './node_modules/readable-stream/**',
            './node_modules/redent/**',
            './node_modules/repeating/**',
            './node_modules/request/**',
            './node_modules/rimraf/**',
            './node_modules/seek-bzip/**',
            './node_modules/semver/**',
            './node_modules/set-immediate-shim/**',
            './node_modules/sigmund/**',
            './node_modules/replace-ext/**',
            './node_modules/sntp/**',
            './node_modules/spdx-correct/**',
            './node_modules/spdx-exceptions/**',
            './node_modules/spdx-expression-parse/**',
            './node_modules/spdx-license-ids/**',
            './node_modules/sql.js/**',
            './node_modules/ssh-keygen/**',
            './node_modules/ssh2/**',
            './node_modules/ssh2-streams/**',
            './node_modules/stat-mode/**',
            './node_modules/stream-combiner/**',
            './node_modules/stream-combiner2/**',
            './node_modules/streamsearch/**',
            './node_modules/string-width/**',
            './node_modules/stringstream/**',
            './node_modules/string_decoder/**',
            './node_modules/strip-ansi/**',
            './node_modules/strip-bom/**',
            './node_modules/strip-dirs/**',
            './node_modules/strip-indent/**',
            './node_modules/strip-json-comments/**',
            './node_modules/sum-up/**',
            './node_modules/supports-color/**',
            './node_modules/tar-stream/**',
            './node_modules/through/**',
            './node_modules/through2/**',
            './node_modules/through2-filter/**',
            './node_modules/tough-cookie/**',
            './node_modules/traverse/**',
            './node_modules/trim-newlines/**',
            './node_modules/tunnel-agent/**',
            './node_modules/typechecker/**',
            './node_modules/typedarray/**',
            './node_modules/unique-stream/**',
            './node_modules/underscore/**',
            './node_modules/url-regex/**',
            './node_modules/util-deprecate/**',
            './node_modules/uuid/**',
            './node_modules/validate-npm-package-license/**',
            './node_modules/vinyl/**',
            './node_modules/vinyl-assign/**',
            './node_modules/vinyl-fs/**',
            './node_modules/ware/**',
            './node_modules/window-size/**',
            './node_modules/wrap-ansi/**',
            './node_modules/wrap-fn/**',
            './node_modules/wrappy/**',
            './node_modules/xtend/**',
            './node_modules/y18n/**',
            './node_modules/yargs/**',
            './node_modules/yauzl/**'], // use the glob format
        platforms: platforms,
        version: 'v0.12.3',
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
