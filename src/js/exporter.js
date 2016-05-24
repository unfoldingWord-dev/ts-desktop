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

            return utils.fs.mkdirs(configurator.getUserPath('datalocation', 'automatic_backups'))
                .then(function () {
                    return utils.fs.mkdirs(configurator.getUserPath('datalocation', 'backups'));
                })
                .catch(function () {
                    throw "Backup location not found. Attach external drive or change backup location in settings.";
                })
                .then(function () {
                    return git.getHash(paths.projectDir);
                })
                .then(function (hash) {
                    var output = fs.createWriteStream(filePath);
                    var archive = archiver.create('zip');
                    var manifest = {
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
                })
                .catch(function (err) {
                    throw "Error creating backup: " + err;
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

                        var content = "";
                        var currentChapter = 0;

                        content += "\\id " + meta.project.id + " " + meta.resource.name + "\n";
                        content += "\\ide " + meta.format + "\n";
                        content += "\\h " + meta.project.name + "\n";
                        content += "\\toc1 " + meta.project.name + "\n";
                        content += "\\toc2 " + meta.project.name + "\n";
                        content += "\\toc3 " + meta.project.id + "\n";
                        content += "\\mt " + meta.project.name + "\n";

                        translation.forEach(function (chunk) {
                            if (chunk.chunkmeta.chapter > 0) {
                                if (chunk.chunkmeta.chapter !== currentChapter) {
                                    content += "\\c " + chunk.chunkmeta.chapter + "\n";
                                    currentChapter = chunk.chunkmeta.chapter;
                                }
                                if (chunk.transcontent) {
                                    var text = chunk.transcontent;
                                    var start = 0;
                                    var keepsearching = true;
                                    while (keepsearching) {
                                        var end = text.indexOf("\\v", start + 2);
                                        if (end === -1) {
                                            keepsearching = false;
                                            content += text.substring(start) + "\n";
                                        } else {
                                            content += text.substring(start, end) + "\n";
                                            start = end;
                                        }
                                    }
                                }
                            }
                        });

                        utils.fs.outputFile(filePath, content).then(function () {
                            resolve(true);
                        }).catch(function (err) {
                            reject(err);
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
