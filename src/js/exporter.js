'use strict';

var _ = require('lodash'),
    path = require('path'),
    archiver = require('archiver'),
    fs = require('fs'),
    utils = require('../js/lib/utils');

function ExportManager(configurator, git) {

    var targetDir = configurator.getValue('targetTranslationsDir'),
        mkdirp = utils.fs.mkdirs,
        rm = utils.fs.remove,
        toJSON = _.partialRight(JSON.stringify, null, '\t');

    return {

        backupTranslation: function (meta, filePath) {
            var paths = utils.makeProjectPaths(targetDir, meta);
            var name = meta.unique_id;

            return new Promise(function(resolve, reject) {
                // need to fix
                var output = fs.createWriteStream(filePath),
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
                let paths = utils.makeProjectPaths(targetDir, meta);
                let sourceDir = paths.projectDir,
                    projectFolder = path.basename(sourceDir),
                    mytargetDir = path.join(backupDir, projectFolder),
                    doBackup = _this.backupTranslation.bind(_this, meta);

                return mkdirp(mytargetDir)
                    .then(function () {
                        return git.getHash(sourceDir);
                    })
                    .then(function(hash) {
                        let fileName = hash + '.backup.tstudio';
                        return path.join(mytargetDir, fileName);
                    })
                    .then(doBackup);
                    //.then(removeOtherFiles);
            });

            return Promise.all(promises);
        },

        exportTranslation: function (translation, meta, filePath, mediaServer) {

            return new Promise(function(resolve, reject) {
                if (meta.project_type_class === "standard") {

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
        }
    };
}

module.exports.ExportManager = ExportManager;
