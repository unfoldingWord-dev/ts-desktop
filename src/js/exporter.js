'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    mkdirP = require('mkdirp'),
    rimraf = require('rimraf'),
    archiver = require('archiver'),
    utils = require('../js/lib/util'),
    git = require('../js/git')(),
    wrap = utils.promisify,
    guard = utils.guard;

var map = guard('map'),
    indexBy = guard('indexBy'),
    flatten = guard('flatten'),
    compact = guard('compact');

function ExportManager(configurator) {

    var write = wrap(fs, 'writeFile'),
        read = wrap(fs, 'readFile'),
        mkdirp = wrap(null, mkdirP),
        rm = wrap(null, rimraf),
        readdir = wrap(fs, 'readdir'),
        stat = wrap(fs, 'stat'),
        isDir = function (f) {
            return stat(f).then(function (s) {
                return s.isDirectory();
            });
        },
        isVisibleDir = function (f) {
            return isDir(f).then(function (isFolder) {
                var name = path.parse(f).name,
                    isHidden = /^\..*/.test(name);

                return (isFolder && !isHidden) ? f : false;
            });
        },
        filterDirs = function (dirs) {
            return Promise.all(_.map(dirs, isVisibleDir)).then(compact());
        },
        readdirs = function (dirs) {
            return Promise.all(_.map(dirs, function (d) {
                return readdir(d).then(map(function (f) {
                    return path.join(d, f);
                }));
            }));
        },
        toJSON = _.partialRight(JSON.stringify, null, '\t'),
        fromJSON = JSON.parse.bind(JSON),

        config = (function (prefix) {
            var isUW = _.partial(_.startsWith, _, prefix, 0),
                isChunk = function (filename) {
                    return _.endsWith(filename, '.txt');
                };

            return {
                filterProjects: _.partial(_.filter, _, isUW),

                filterChapters: filterDirs,

                filterChunks: _.partial(_.filter, _, isChunk),

                get targetDir () {
                    return configurator.getValue('targetTranslationsDir');
                },


                makeProjectPaths: function (meta) {
                    var filename = meta.unique_id;
                    return this.makeProjectPathsForProject(filename);
                },

                makeProjectPathsForProject: function (project) {
                    var targetDir = this.targetDir,
                        projectDir = path.join(targetDir, project);

                    return {
                        parentDir: targetDir,
                        projectDir: projectDir,
                        manifest: path.join(projectDir, 'manifest.json'),
                        license: path.join(projectDir, 'LICENSE.md')
                    };

                }
            };
        })('uw-');

    return {

        getPaths: function(meta) {
            return config.makeProjectPaths(meta);
        },

        backupTranslation: function (meta, filePath) {
            let paths = this.getPaths(meta),
                name = meta.unique_id;

            return new Promise(function(resolve, reject) {
                let output = fs.createWriteStream(filePath),
                    archive = archiver.create('zip'),
                    manifest = {
                        generator: {
                            name: 'ts-desktop',
                            build: ''
                        },
                        package_version: 2,
                        timestamp: new Date().getTime(),
                        target_translations: [{path: name, id: name, commit_hash: '', direction: "ltr"}]
                    };
                archive.pipe(output);
                archive.directory(paths.projectDir, name + "/");
                archive.append(toJSON(manifest), {name: 'manifest.json'});
                archive.finalize();
                resolve(filePath);
            });
        },

        /*
         * Moves (using utils function) .tstudio files from the old to the new path
         * @param oldPath: source backup directory
         * @param newPath: target backup directory
         */
        migrateBackup: function(oldPath, newPath) {
            utils.move(path.join(oldPath, 'automatic_backups'), path.join(newPath, 'automatic_backups'), {clobber: true});
            utils.move(path.join(oldPath, 'backups'), path.join(newPath, 'backups'), {clobber: true});
        },

        /*
         * Store projects in automatic backup folder if there's any change
         * @param list: projectlist property
         */
        backupProjects: function(list) {
            let _this = this,
                backupDir = configurator.getUserPath('datalocation', 'automatic_backups');

            /*
             * NOTE: We are removing *after* we backup so that a backup is already there.
             *          Example scenario: App attempts to auto backup, deletes all the
             *          generated auto backups, tries to backup, then crashes. In this
             *          instance, the user is left without backups. So, instead, we
             *          clear out any old files only after we are certain that there
             *          is a new backup.
             */

            let removeOtherFiles = function(backupName) {
                let paths = path.parse(backupName),
                    dir = paths.dir,
                    hash = paths.base.split('.')[0];

                // N.B. Double check that we're in the backups folder before doing any remove/delete
                return dir.startsWith(backupDir) ? rm(dir + '/!(' + hash + ')*') : false;
            };

            let promises = _.map(list, function(meta) {
                let sourceDir = _this.getPaths(meta).projectDir,
                    projectFolder = path.basename(sourceDir),
                    targetDir = path.join(backupDir, projectFolder),
                    doBackup = _this.backupTranslation.bind(_this, meta);

                return mkdirp(targetDir)
                    .then(function () {
                        return git.getHash(sourceDir);
                    })
                    .then(function(hash) {
                        let fileName = hash + '.backup.tstudio';
                        return path.join(targetDir, fileName);
                    })
                    .then(doBackup)
                    .then(removeOtherFiles);
            });

            return Promise.all(promises);
        },

        /**
         *
         * @param translation an array of frames
         * @param meta the target translation manifest and other info
         * @param filePath the path where the export will be saved
         * @param mediaServer is the location of the media files
         * @returns {Promise.<boolean>}
         */
        exportTranslation: function (translation, meta, filePath, mediaServer) {

            var isTranslation = this.isTranslation(meta);

            return new Promise(function(resolve, reject) {
                if (isTranslation) {

                    if (meta.format === 'markdown') {

                        let chapterContent = '',
                            currentChapter = -1,
                            zip = archiver.create('zip'),
                            output = fs.createWriteStream(filePath),
                            numFinishedFrames = 0;
                        zip.pipe(output);
                        for(let frame of translation) {

                            // close chapter chapter
                            if(frame.chunkmeta.chapter !== currentChapter) {
                                if(chapterContent !== '' && numFinishedFrames > 0) {
                                    // TODO: we need to get the chapter reference and insert it here
                                    chapterContent += '////\n';
                                    //console.log('chapter ' + currentChapter, chapterContent);
                                    zip.append(new Buffer(chapterContent), {name: currentChapter + '.txt'});
                                }
                                currentChapter = frame.chunkmeta.chapter;
                                chapterContent = '';
                                numFinishedFrames = 0;
                            }

                            if(frame.transcontent !== '') {
                                numFinishedFrames ++;
                            }

                            // build chapter header
                            if(chapterContent === '') {
                                chapterContent += '//\n';
                                chapterContent += meta.target_language.name + '\n';
                                chapterContent += '//\n\n';

                                chapterContent += '//\n';
                                chapterContent += meta.project.name + '\n';
                                chapterContent += '//\n\n';

                                chapterContent += '//\n';
                                chapterContent += frame.chunkmeta.title + '\n';
                                chapterContent += '//\n\n';
                            }

                            // add frame
                            chapterContent += '{{' + mediaServer + meta.project.id + '/jpg/1/en/360px/' + meta.project.id + '-' + meta.target_language.id + '-' + frame.chunkmeta.chapterid + '-' + frame.chunkmeta.frameid + '.jpg}}\n\n';
                            chapterContent += frame.transcontent + '\n\n';
                        }
                        if(chapterContent !== '' && numFinishedFrames > 0) {
                            // TODO: we need to get the chapter reference and insert it here
                            chapterContent += '////\n';
                            zip.append(new Buffer(chapterContent), {name: currentChapter + '.txt'});
                        }
                        zip.finalize();
                        resolve(true);
                    } else if (meta.format === 'usfm') {
                         let
                            currentChapter = 1,
                            numFinishedFrames = 0,
                            chapterContent = '';
                        for(let frame of translation) {
                            // build chapter header
                            if(chapterContent === '') {
                                //add in USFM header elements
                                chapterContent += '\n\\\id ' + meta.project.id.toUpperCase() + ' ' + meta.source_translations[0].resource_name + '\n';

                                chapterContent += '\\\ide ' + meta.format + '\n';

                                chapterContent += '\\\h ' + meta.project.name.toUpperCase() + '\n';

                                chapterContent += '\\' + 'toc1 ' + meta.project.name + '\n';

                                chapterContent += '\\' + 'toc2 ' + meta.project.name + '\n';

                                chapterContent += '\\' + 'toc3 ' + meta.project.id + '\n';

                                chapterContent += '\\\mt1 ' + meta.project.name.toUpperCase() + '\n';

                                chapterContent += '\\\c ' + frame.chunkmeta.chapter + '\n';
                            }
                            if(currentChapter !== frame.chunkmeta.chapter){
                                chapterContent += '\\\c ' + frame.chunkmeta.chapter + '\n';
                                currentChapter = frame.chunkmeta.chapter;
                            }
                            // add frame
                            if(frame.transcontent !== ''){
                            chapterContent += frame.transcontent + '\n';
                            }
                        }

                        fs.writeFile(filePath, new Buffer(chapterContent));
                        resolve(true);
                    } else {
                        reject("We do not support exporting this project format yet");
                    }
                } else {
                    // TODO: support exporting other target translation types if needed e.g. notes, words, questions
                    reject('We do not support exporting this project type yet');
                }
            });
        },

        isTranslation: function (meta) {
            return !meta.type.id || meta.type.id === 'text';
        }
    };
}

module.exports.ExportManager = ExportManager;
