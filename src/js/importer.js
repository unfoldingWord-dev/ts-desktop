'use strict';

var _ = require('lodash'),
    path = require('path'),
    AdmZip = require('adm-zip'),
    utils = require('../js/lib/utils');

function ImportManager(configurator, migrator) {

    return {

        restoreFromBackup: function(filePath) {
            let zip = new AdmZip(filePath),
                tmpDir = configurator.getValue('tempDir'),
                targetDir = configurator.getValue('targetTranslationsDir'),
                basename = path.basename(filePath, '.tstudio'),
                extractPath = path.join(tmpDir, basename);

            return migrator.listTargetTranslations(filePath)
                .then(function(targetPaths) {
                    // NOTE: this will eventually be async
                    zip.extractAllTo(extractPath, true);
                    return targetPaths;
                })
                .then(function (targetPaths) {
                    return _.map(targetPaths, function (targetPath) {
                        return utils.makeProjectPaths(extractPath, targetPath);
                    });
                })
                .then(migrator.migrateAll.bind(migrator))
                .then(function (results) {
                    if (!results.length) {
                        throw new Error ("Could not restore this project");
                    }
                    return results;
                })
                .then(function (results) {
                    return _.map(results, function (result) {
                        return result.paths.projectDir.substring(result.paths.projectDir.lastIndexOf(path.sep) + 1);
                    });
                })
                .then(function (targetPaths) {
                    return _.map(targetPaths, function(p) {
                        let tmpPath = path.join(extractPath, p),
                            targetPath = path.join(targetDir, p);

                        return utils.fs.move(tmpPath, targetPath, {clobber: true});
                    });
                })
                .then(function (list) {
                    return Promise.all(list);
                })
                .then(function () {
                    return utils.fs.remove(tmpDir);
                });
        },

        importFromBackup: function(filePath) {
            let zip = new AdmZip(filePath),
                tmpDir = configurator.getValue('tempDir'),
                targetDir = configurator.getValue('targetTranslationsDir'),
                basename = path.basename(filePath, '.tstudio'),
                extractPath = path.join(tmpDir, basename);

            return migrator.listTargetTranslations(filePath)
                .then(function(targetPaths) {
                    // NOTE: this will eventually be async
                    zip.extractAllTo(extractPath, true);
                    return targetPaths;
                })
                .then(function (targetPaths) {
                    return _.map(targetPaths, function (targetPath) {
                        return utils.makeProjectPaths(extractPath, targetPath);
                    });
                })
                .then(migrator.migrateAll.bind(migrator))
                .then(function (results) {
                    if (!results.length) {
                        throw new Error ("Could not restore this project");
                    }
                    return results;
                })
                .then(function (results) {
                    return _.map(results, function (result) {
                        return result.paths.projectDir.substring(result.paths.projectDir.lastIndexOf(path.sep) + 1);
                    });
                })
                .then(function (targetPaths) {
                    return _.map(targetPaths, function(p) {
                        let tmpPath = path.join(extractPath, p),
                            targetPath = path.join(targetDir, p);

                        return utils.fs.move(tmpPath, targetPath, {clobber: true});
                    });
                })
                .then(function (list) {
                    return Promise.all(list);
                })
                .then(function () {
                    return utils.fs.remove(tmpDir);
                });
        },

        importUSFMFile: function (file, translation, user) {

            var self = this;
            let fileExt = file.name.split('.').pop().toLowerCase();

            if (fileExt === "zip") {
                return self.getTxtFilesFromZip(file).then(function (files) {

                    let txtFile = files[0];
                    var promise = self.importSingleUSFMFile(txtFile, translation, user);
                    for (var i = 1; i < files.length; i++) {
                        txtFile = files[i];
                        promise = promise.then(function(){
                            return self.importSingleUSFMFile(txtFile, translation, user);
                        });
                    }
                    return promise;
                });
            } else {

                return self.importSingleUSFMFile(file.path, translation, user);
            }
        },

        getTxtFilesFromZip: function (zipFile) {
            var tempDir = path.join(configurator.getValue('tempDir'), "usfm-import");

            return new Promise(function (resolve, reject) {
                let zip = new AdmZip(zipFile.path);
                zip.extractAllTo(tempDir, true);
                var files = fs.readdirSync(tempDir),
                    output = [];
                files.forEach(function (file) {
                    output.push(path.join(tempDir, file));
                });

                resolve(output);
            });
        },

        getVerseChunkFileNames: function(projdata){
            return new Promise(function(resolve, reject){
                var book = projdata.project.id;
                var chunkDescUrl = "https://api.unfoldingword.org/bible/txt/1/" + book + "/chunks.json";
                var chunks = [];
                request(chunkDescUrl,function(err, resp, body){
                    if(!err){
                        var chunkDesc = JSON.parse(body);
                        for(var i = 0; i<chunkDesc.length; i++){
                            var chunk = chunkDesc[i],
                                verses = [],
                                nextChunkChapter = typeof chunkDesc[i + 1] !== 'undefined' ? chunkDesc[i + 1].chp : false;

                            //if the next chunk exists and it's the same chapter as the current chunk...
                            if (nextChunkChapter === chunk.chp) {
                                var lastVs = chunkDesc[i + 1].firstvs - 1;
                                for (var v = parseInt(chunk.firstvs); v <= lastVs; v++) {
                                    verses.push(v);
                                }

                                //if it doesn't exist or it's not the same chapter as the current chunk, add 100 verses so we make sure to get everything being imported.
                            } else {
                                var v = parseInt(chunk.firstvs), max = v + 100;
                                for(v; v<max; v++){
                                    verses.push(v);
                                }
                            }
                            var chk = {
                                filename: chunk.firstvs,
                                chapter: chunk.chp,
                                verses: verses
                            };
                            chunks.push(chk);
                        }
                        resolve(chunks);
                    } else {
                        reject(err);
                    }
                });
            });
        },

        importSingleUSFMFile: function (usfmFile, projdata, user) {
            let self = this;
            return pm.loadTargetTranslation(projdata).then(function(curProj){

                return self.getVerseChunkFileNames(projdata).then(function(chunkFileNames){
                    var parser = new UsfmParser();
                    return parser.load(usfmFile).then(function(){
                        var parsedData = parser.parse();

                        //if there was no data in the file, it's most likely the wrong format.
                        if(JSON.stringify(parsedData) === JSON.stringify({})){
                            throw new Error('This is not a valid USFM file.');
                        }

                        for(var i = 0; i<chunkFileNames.length; i++){
                            var chunk = chunkFileNames[i];
                            var transcontent = '';

                            for(var ci = 0; ci<chunk.verses.length; ci++){
                                if(typeof parsedData[chunk.chapter] !== 'undefined' && typeof parsedData[chunk.chapter].verses[chunk.verses[ci]] !== 'undefined'){
                                    //transcontent += '\\v' + parsedData[chunk.chapter].verses[chunk.verses[ci]].id + ' ' + parsedData[chunk.chapter].verses[chunk.verses[ci]].contents;
                                    transcontent += ' ' + parsedData[chunk.chapter].verses[chunk.verses[ci]].contents;
                                }
                            }
                            chunkFileNames[i].meta = {
                                chapterid: chunkFileNames[i].chapter,
                                frameid: chunkFileNames[i].filename,
                                helpscontent: []
                            };

                            chunkFileNames[i].completed = false;
                            chunkFileNames[i].transcontent = transcontent;
                        }


                        //Pull in the title
                        if(typeof parsedData['00'] !== 'undefined'){
                            chunkFileNames.push({
                                meta: {
                                    chapterid: '00',
                                    frameid: 'title',
                                    helpscontent: []
                                },
                                transcontent: parsedData['00'].contents,
                                completed: true
                            });
                        }

                        return pm.saveTargetTranslation(chunkFileNames, projdata, user);
                    });
                });
            });

        }

    };
}

function UsfmParser (file) {
    this.contents = [];

    var markerTypes = {
        id: {
            regEx: /\\id/,
            hasOptions: false,
            type: "id"
        },
        encoding: {
            regEx: /\\ide/,
            hasOptions: false,
            type: "encoding"
        },
        majorTitle: {
            regEx: /\\mt[0-9]*/,
            hasOptions: false,
            type: "majorTitle"
        },
        heading: {
            regEx: /\\h[0-9]*/,
            hasOptions: false,
            type: "heading"
        },
        chapter: {
            regEx: /\\c/,
            hasOptions: true,
            type: "chapter"
        },
        verse: {
            regEx: /\\v/,
            hasOptions: true,
            type: "verse"
        },
        sectionHeading: {
            regEx: /\\s[0-9]*/,
            hasOptions: false,
            type: "sectionHeading"
        },
        tableOfContents: {
            regEx: /\\toc[0-2]*/,
            hasOptions: false,
            type: "tableOfContents"
        }
    };

    var project = {
        encoding: "usx",
        chapters: []
    };

    var getMarker = function (line) {
        var beginMarker = line.split(" ")[0];
        for (var type in markerTypes) {
            if (markerTypes[type].regEx.test(beginMarker)) {
                return markerTypes[type];
            }

        }
        return false;
    };

    var self = this;

    return {
        load: function (file) {
            self.file = file;

            return new Promise(function(resolve, reject){

                var lineReader = require('readline').createInterface({
                    input: fs.createReadStream(self.file)
                });

                lineReader.on('line', function (line) {
                    if(typeof line !== "undefined"){
                        self.contents.push(line);
                    }

                });

                lineReader.on('close', function(){
                    resolve(self);
                });
            });
        },
        parse: function(){
            this.getMarkers();
            return this.buildChapters();
        },
        getMarkers: function () {
            self.markers = [];
            self.markerCount = 0;
            var currentMarker = null;
            for (var i = 0; i < self.contents.length; i++) {
                var line = self.contents[i];
                var lineArray = line.split(" ");
                for(var c=0; c<lineArray.length; c++){
                    var section = lineArray[c];
                    var marker = getMarker(section);

                    if (marker) {
                        self.markers[self.markerCount] = {
                            type: marker.type,
                            line: line,
                            contents: ""
                        };
                        if(marker.hasOptions){
                            self.markers[self.markerCount].options = lineArray[c + 1];
                            c++;
                        }
                        currentMarker = self.markers[self.markerCount];
                        self.markerCount++;
                    } else {
                        if(currentMarker){
                            currentMarker.contents += section + " ";
                        }
                    }
                }
            }
        },
        buildChapters: function(){
            self.chapters = {};
            var chap;
            for(var m in self.markers){
                var marker = self.markers[m];
                if(marker.type === "chapter"){
                    chap = String("00" + marker.options).slice(-2);
                    var chapter =
                        self.chapters[chap] = {
                            id: chap,
                            verses: {}
                        };
                    //self.chapters.push(chapter);
                } else if(marker.type === "verse"){
                    self.chapters[chap].verses[marker.options] = {
                        id: marker.options,
                        contents: marker.contents
                    }
                } else if(marker.type === "heading"){
                    self.chapters['00'] = {
                        id: '00',
                        verses: {},
                        contents: marker.contents
                    };
                }

            }
            //console.log("chapters",self.chapters);
            return self.chapters;
        }
    }
}

module.exports.ImportManager = ImportManager;
module.exports.UsfmParser = UsfmParser;
