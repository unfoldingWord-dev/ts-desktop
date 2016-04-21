'use strict';

var _ = require('lodash'),
    path = require('path'),
    archiver = require('archiver'),
    fs = require('fs'),
    utils = require('../js/lib/utils');

function ExportManager(configurator, git) {

    var targetDir = configurator.getValue('targetTranslationsDir');

    return {

        backupTranslation: function (meta, filePath) {
            if(filePath.split('.').pop() !== 'tstudio') {
                filePath += '.tstudio';
            }
            var paths = utils.makeProjectPaths(targetDir, meta);
            var name = meta.unique_id;

            return git.getHash(paths.projectDir).then(function (hash) {
                var output = fs.createWriteStream(filePath),
                    archive = archiver.create('zip'),
                    manifest = {
                        generator: {
                            name: 'ts-desktop',
                            build: ''
                        },
                        package_version: 2,
                        timestamp: new Date().getTime(),
                        target_translations: [{path: name, id: name, commit_hash: hash, direction: meta.target_language.direction}]
                    };
                archive.pipe(output);
                archive.directory(paths.projectDir, name + "/");
                archive.append(JSON.stringify(manifest, null, '\t'), {name: 'manifest.json'});
                archive.finalize();
                return filePath;
            });
        },

        backupAllTranslations: function (list, dirPath) {
            var mythis = this;
            var promises = _.map(list, function(projectmeta) {
                var filepath = path.join(dirPath, projectmeta.unique_id + ".tstudio");
                return mythis.backupTranslation(projectmeta, filepath);
            });
            return Promise.all(promises);
        },

        exportTranslation: function (translation, meta, filePath, mediaServer) {
            return new Promise(function(resolve, reject) {
                if (meta.project_type_class === "standard") {

                    if (meta.format === 'markdown') {
                        if(filePath.split('.').pop() !== 'zip') {
                            filePath += '.zip';
                        }
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
                                    zip.append(new Buffer(chapterContent), {name: currentChapter + '.md'});
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
                            zip.append(new Buffer(chapterContent), {name: currentChapter + '.md'});
                        }
                        zip.finalize();
                        resolve(true);
                    } else if (meta.format === 'usfm') {
                        if(filePath.split('.').pop() !== 'usfm') {
                            filePath += '.usfm';
                        }
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

                        fs.writeFile(filePath, new Buffer(chapterContent), function (err) {
                            if (err) {
                                reject(err);
                            }
                            resolve(true);
                        });
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
