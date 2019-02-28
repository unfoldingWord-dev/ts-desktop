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
    replace = require('gulp-replace'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    fs = require('fs'),
    util = require('./src/js/lib/utils'),
    princePackager = require('./src/js/prince-packager');
const ncp = require('ncp').ncp;

const APP_NAME = 'translationStudio',
    JS_FILES = './src/js/**/*.js',
    UNIT_TEST_FILES = './unit_tests/**/*.js',
    BUILD_DIR = 'out/',
    RELEASE_DIR = 'release/';

function copy(src, dest) {
    return new Promise((resolve, reject) => {
        console.log(`copying ${src} to ${dest}`);
        ncp(src, dest, (err) => {
            if (err) {
                console.log(`failed copying ${src}`);
                reject(err);
            } else {
                console.log(`finished copying ${src}`);
                resolve();
            }
        });
    });
}

gulp.task('test', function() {
    return gulp.src(UNIT_TEST_FILES, {read: false}).
        pipe(mocha({reporter: 'spec', grep: (argv.grep || argv.g)}));
});

gulp.task('clean', function() {
    rimraf.sync('src/logs');
    rimraf.sync('logs');
    rimraf.sync('ssh');
});

gulp.task('bump', function() {
    var build = require('./package').build;

    var bumped = ++build;

    var replaceString = '$1"' + bumped + '"$2';

    console.log(bumped);
    return gulp.src(['package.json']).
        pipe(replace(/("build"\s*:\s*)"\d+"(.*)/, replaceString)).
        pipe(gulp.dest('./'));
});

/**
 * This will download and install prince binaries for all os'
 */
gulp.task('prince', function(done) {
    var tempDir = 'src/prince';

    util.chain(princePackager.install.bind(null, tempDir))(
        ['win', 'linux', 'osx']).then(function() {
        done();
    }).catch(done);
});

// pass parameters like: gulp build --win --osx --linux
gulp.task('build', ['clean'], function(done) {

    var platforms = [];

    if (argv.win) {
        platforms.push('win32');
    }
    if (argv.macos) {
        platforms.push('darwin');
    }
    if (argv.linux) {
        platforms.push('linux');
    }
    if (!platforms.length) {
        platforms.push('win32', 'darwin', 'linux');
    }

    var p = require('./package');
    var ignored = Object.keys(p.devDependencies).concat([
        'unit_tests',
        'acceptance_tests',
        '__tests__',
        '__mocks__',
        'out',
        BUILD_DIR,
        RELEASE_DIR,
        'vendor',
        'scripts',
        '\\.'
    ]).map(function(name) {
        return new RegExp('(^/' + name + '|' + '^/node_modules/' + name + ')');
    });

    packager({
        'asar': true,
        'arch': 'all',
        'platform': platforms,
        'dir': '.',
        'ignore': function(name) {
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
    }, (err) => {
        if (err) {
            throw new Error(err);
        }
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

/**
 * Compiles a .deb package
 * @param out - the path to which the release will be saved
 */
gulp.task('release-linux', () => {
    const p = require('./package');

    const outPath = argv.out;
    if (!outPath || typeof outPath !== 'string') {
        throw new Error('The --out argument is required.');
    }

    mkdirp.sync('release');
    const buildPath = BUILD_DIR + p.productName + '-linux-x64/';
    if (!fs.existsSync(buildPath)) {
        throw new Error(`The build path "${buildPath}" does not exist`);
    }

    // build .deb
    const tmp = buildPath.replace(/\/+$/, '') + '.deb.stage';
    const optDir = path.join(tmp, 'opt/' + p.name);
    mkdirp.sync(tmp);

    return copy('./scripts/deb', tmp).then(() => {
        return copy(buildPath, optDir);
    }).then(() => {
        console.log('compiling');
        // compile
        return new Promise((resolve, reject) => {
            const exec = require('child_process').exec;
            const dest = path.normalize(outPath);
            mkdirp.sync(path.dirname(dest));
            let cmd = `dpkg-deb --build ${tmp} ${dest}`;
            exec(cmd, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
});

/**
 * Releases a macOS build
 * @param out - the path to which the release will be saved.
 */
gulp.task('release-macos', () => {
    const p = require('./package');
    const exec = require('child_process').exec;
    const isLinux = /^linux/.test(process.platform);
    const isMacOS = /^darwin/.test(process.platform);

    const outPath = argv.out;
    if (!outPath || typeof outPath !== 'string') {
        throw new Error('The --out argument is required.');
    }

    if (!isLinux && !isMacOS) {
        throw new Error(
            'You must be on Linux or macOS to create macOS releases');
    }

    mkdirp.sync('release');
    const buildPath = BUILD_DIR + p.name + '-darwin-x64/';
    if (!fs.existsSync(buildPath)) {
        throw new Error(`The build path "${buildPath}" does not exist`);
    }

    return new Promise((resolve, reject) => {
        const dest = path.normalize(outPath);
        mkdirp.sync(path.dirname(dest));
        let cmd = `scripts/osx/makedmg.sh "${p.name}" ${buildPath} ${dest}`;
        console.log(cmd);
        exec(cmd, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
});

/**
 * Releases a Windows x64 build
 */
gulp.task('release-win64', () => {
    const p = require('./package');

    const outPath = argv.out;
    if (!outPath || typeof outPath !== 'string') {
        throw new Error('The --out argument is required.');
    }

    const buildPath = BUILD_DIR + p.name + '-win32-x64/';
    if (!fs.existsSync(buildPath)) {
        throw new Error(`The build path "${buildPath}" does not exist`);
    }

    return releaseWindows('64', buildPath, path.normalize(outPath));
});

/**
 * Releases a Windows x32 build
 */
gulp.task('release-win32', () => {
    const p = require('./package');

    const outPath = argv.out;
    if (!outPath || typeof outPath !== 'string') {
        throw new Error('The --out argument is required.');
    }

    const buildPath = BUILD_DIR + p.name + '-win32-ia32/';
    if (!fs.existsSync(buildPath)) {
        throw new Error(`The build path "${buildPath}" does not exist`);
    }

    return releaseWindows('32', buildPath, path.normalize(outPath));
});

/**
 * Releases a windows build
 * @param {string} arch - the os architecture (e.g. 64 or 32)
 * @param {string} src - the build directory
 * @param {string} dest - the release file path
 * @return {Promise<never>}
 */
const releaseWindows = (arch, src, dest) => {
    const p = require('./package');
    const exec = require('child_process').exec;

    const isLinux = /^linux/.test(process.platform);
    const isWindows = /^win/.test(process.platform);

    // locate Inno Setup
    let isccPath;
    if (isLinux) {
        isccPath = './scripts/innosetup/iscc';
    } else if (isWindows) {
        isccPath = `"${process.env['ProgramFiles(x86)']}/Inno Setup 5/ISCC.exe"`;
    } else {
        return Promise.reject(
            'Windows builds can only be released on linux and windows');
    }

    // on windows you can manually install Inno Setup
    // on linux you can execute ./scripts/innosetup/setup.sh
    if (!fs.existsSync(isccPath.replace(/"/g, ''))) {
        return Promise.reject(
            'Inno Setup is not installed. Please install Inno Setup and try again.');
    }

    const destDir = path.dirname(dest);
    mkdirp.sync(destDir);
    // TRICKY: the iss script cannot take the .exe extension on the file name
    const file = path.basename(dest, '.exe');
    let cmd = `${isccPath} scripts/win_installer.iss /DArch=${arch === '64'
        ?
        'x64'
        :
        'x86'} /DRootPath=../ /DVersion=${p.version} /DDestFile=${file} /DDestDir=${destDir} /DBuildDir=${BUILD_DIR} /q`;

    return new Promise(function(resolve, reject) {
        console.log(`Generating ${arch} bit windows installer`);
        console.log(`executing: \n${cmd}\n`);
        exec(cmd, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

gulp.task('default', ['test']);
