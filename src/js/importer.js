'use strict';

var _ = require('lodash');
var path = require('path');
var AdmZip = require('adm-zip');
var request = require('request');
var fs = require('fs');
var readline = require('readline');
var utils = require('../js/lib/utils');
var {usfm3ToUsfm2} = require('./usfm');

function ImportManager(configurator, migrator, dataManager) {

    return {

        extractBackup: function(filePath) {
            var tmpDir = configurator.getValue('tempDir');
            var targetDir = configurator.getValue('targetTranslationsDir');
            var basename = path.basename(filePath, '.tstudio');
            var extractPath = path.join(tmpDir, basename);

            return migrator.listTargetTranslations(filePath)
                .then(function(targetPaths) {
                    var zip = new AdmZip(filePath);

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
                        var tmpPath = path.join(extractPath, p),
                            targetPath = path.join(targetDir, p);

                        return utils.fs.stat(targetPath).then(utils.ret(true)).catch(utils.ret(false))
                            .then(function (exists) {
                                return {tmpPath: tmpPath, targetPath: targetPath, targetExists: exists};
                            });
                    });
                })
                .catch(function (err) {
                    throw "Error while extracting file: " + err;
                })
                .then(Promise.all.bind(Promise));
        },

        retrieveUSFMProjectID: function (filepath) {
            var id = "";

            return new Promise(function (resolve, reject) {
                var lineReader = readline.createInterface({
                    input: fs.createReadStream(filepath)
                });
                lineReader.on('line', function (line) {
                    if (line && line.trim().split(" ")[0] === "\\id") {
                        id = line.trim().split(" ")[1].toLowerCase();
                        lineReader.close();
                    }
                });
                lineReader.on('close', function(){
                    resolve(id);
                });
            });
        },

        importFromUSFM: function (filepath, projectmeta) {
            return chunkUSFM(filepath, projectmeta, dataManager);
            // var parser = new UsfmParser();
            //
            // return parser.load(filepath)
            //     .then(function () {
            //         var parsedData = parser.parse();
            //
            //         if (JSON.stringify(parsedData) === JSON.stringify({})) {
            //             throw new Error('This is not a valid USFM file.');
            //         }
            //         var chunks = [];
            //         var markers = dataManager.getChunkMarkers(projectmeta.project.id);
            //
            //         for (var i = 0; i < markers.length; i++) {
            //             var frameid = markers[i].verse;
            //             var first = parseInt(frameid);
            //             var chapter = markers[i].chapter;
            //             var isLastChunkOfChapter = !markers[i+1] || markers[i+1].chapter !== chapter;
            //             var last = isLastChunkOfChapter ? Number.MAX_VALUE : parseInt(markers[i+1].verse) - 1;
            //
            //             if (parsedData[chapter]) {
            //                 var transcontent = _.chain(parsedData[chapter].verses).filter(function (verse) {
            //                     var id = parseInt(verse.id);
            //                     return id <= last && id >= first;
            //                 }).map("contents").value().join(" ");
            //
            //                 chunks.push({
            //                     chunkmeta: {
            //                         chapterid: chapter,
            //                         frameid: frameid
            //                     },
            //                     transcontent: transcontent.trim(),
            //                     completed: false
            //                 });
            //             }
            //         }
            //
            //         if (parsedData['front'] && parsedData['front'].contents) {
            //             chunks.unshift({
            //                 chunkmeta: {
            //                     chapterid: 'front',
            //                     frameid: 'title'
            //                 },
            //                 transcontent: parsedData['front'].contents.trim(),
            //                 completed: false
            //             });
            //         }
            //         return chunks;
            //     })
            //     .catch(function (err) {
            //         throw "Error occurred parsing file: " + err;
            //     });
        }
    };
}

function UsfmParser () {
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

    var getMarker = function (line) {
        var beginMarker = line.split(" ")[0];
        for (var type in markerTypes) {
            if (markerTypes[type].regEx.test(beginMarker)) {
                return markerTypes[type];
            }
        }
        return false;
    };

    var mythis = this;

    return {
        load: function (file) {
            mythis.file = file;

            return new Promise(function (resolve, reject) {
                const data = fs.readFileSync(mythis.file, {encoding: 'utf8'}).toString();
                const cleanData = usfm3ToUsfm2(data);
                mythis.contents.push.apply(mythis.contents, cleanData.split('\n'));
                resolve(mythis);
            });
        },

        parse: function(){
            this.getMarkers();
            return this.buildChapters();
        },

        getMarkers: function () {
            mythis.markers = [];
            mythis.markerCount = 0;
            var currentMarker = null;
            for (var i = 0; i < mythis.contents.length; i++) {
                var line = mythis.contents[i];
                var lineArray = line.split(" ");
                for (var c = 0; c < lineArray.length; c++) {
                    var section = lineArray[c];
                    var marker = getMarker(section);

                    if (marker) {
                        mythis.markers[mythis.markerCount] = {
                            type: marker.type,
                            line: line,
                            contents: ""
                        };
                        if (marker.hasOptions) {
                            mythis.markers[mythis.markerCount].options = lineArray[c + 1];
                            c++;
                        }
                        currentMarker = mythis.markers[mythis.markerCount];
                        if (marker.type === "verse") {
                            currentMarker.contents = section + " " + currentMarker.options + " ";
                        }
                        mythis.markerCount++;
                    } else {
                        if (currentMarker) {
                            currentMarker.contents += section + " ";
                        }
                    }
                }
            }
        },

        buildChapters: function () {
            mythis.chapters = {};
            var chap;
            var chapnum = 0;
            var lastverse = 100;

            var createchapter = function (chapnum) {
                chap = chapnum.toString();
                if (chap.length === 1) {
                    chap = "0" + chap;
                }
                mythis.chapters[chap] = {
                    id: chap,
                    verses: {}
                };
            };

            mythis.markers.forEach(function (marker) {
                if (marker.type === "heading" && chapnum === 0) {
                    createchapter("front");
                    mythis.chapters[chap].contents = marker.contents.trim();
                } else if (marker.type === "chapter") {
                    chapnum = parseInt(marker.options);
                    createchapter(chapnum);
                    lastverse = 0;
                } else if (marker.type === "verse") {
                    var thisverse = parseInt(marker.options);

                    if (thisverse < lastverse) {
                        chapnum++;
                        createchapter(chapnum);
                    }
                    lastverse = thisverse;

                    mythis.chapters[chap].verses[marker.options] = {
                        id: marker.options,
                        contents: marker.contents.trim()
                    };
                }
            });

            return mythis.chapters;
        }
    };
}

function chunkUSFM(filepath, projectmeta, dataManager) {
    var parser = new UsfmParser();

    return parser.load(filepath)
    .then(function () {
        var parsedData = parser.parse();

        if (JSON.stringify(parsedData) === JSON.stringify({})) {
            throw new Error('This is not a valid USFM file.');
        }
        var chunks = [];
        var markers = dataManager.getChunkMarkers(projectmeta.project.id);

        for (var i = 0; i < markers.length; i++) {
            var frameid = markers[i].verse;
            var first = parseInt(frameid);
            var chapter = markers[i].chapter;
            var isLastChunkOfChapter = !markers[i+1] || markers[i+1].chapter !== chapter;
            var last = isLastChunkOfChapter ? Number.MAX_VALUE : parseInt(markers[i+1].verse) - 1;

            if (parsedData[chapter]) {
                var transcontent = _.chain(parsedData[chapter].verses).filter(function (verse) {
                    var id = parseInt(verse.id);
                    return id <= last && id >= first;
                }).map("contents").value().join("\n");

                chunks.push({
                    chunkmeta: {
                        chapterid: chapter,
                        frameid: frameid
                    },
                    transcontent: transcontent.trim(),
                    completed: false
                });
            }
        }

        if (parsedData['front'] && parsedData['front'].contents) {
            chunks.unshift({
                chunkmeta: {
                    chapterid: 'front',
                    frameid: 'title'
                },
                transcontent: parsedData['front'].contents.trim(),
                completed: false
            });
        }
        return chunks;
    })
    .catch(function (err) {
        throw "Error occurred parsing file: " + err;
    });
}

module.exports.ImportManager = ImportManager;
module.exports.UsfmParser = UsfmParser;
module.exports.chunkUSFM = chunkUSFM;
