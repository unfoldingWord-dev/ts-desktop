'use strict';

var _ = require('lodash'),
    path = require('path'),
    AdmZip = require('adm-zip'),
    request = require('request'),
    fs = require('fs'),
    readline = require('readline'),
    utils = require('../js/lib/utils');

function ImportManager(configurator, migrator, dataManager) {

    return {

        extractBackup: function(filePath) {
            var zip = new AdmZip(filePath),
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
                        var frameid = markers[i].first_verse_slug;
                        var first = parseInt(frameid);
                        var chapter = markers[i].chapter_slug;
                        var isLastChunkOfChapter = !markers[i+1] || markers[i+1].chapter_slug !== chapter;
                        var last = isLastChunkOfChapter ? Number.MAX_VALUE : parseInt(markers[i+1].first_verse_slug) - 1;
    
                        if (parsedData[chapter]) {
                            var transcontent = _.chain(parsedData[chapter].verses).filter(function (verse) {
                                var id = parseInt(verse.id);
                                return id <= last && id >= first;
                            }).map("contents").value().join("");
    
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
    
                    if (parsedData['00'] && parsedData['00'].contents) {
                        chunks.unshift({
                            chunkmeta: {
                                chapterid: '00',
                                frameid: 'title'
                            },
                            transcontent: parsedData['00'].contents.trim(),
                            completed: false
                        });
                    }
                    return chunks;
                })
                .catch(function (err) {
                    throw "Error occurred parsing file: " + err;
                });
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

                var lineReader = readline.createInterface({
                    input: fs.createReadStream(mythis.file, {encoding: "utf8"})
                });

                lineReader.on('line', function (line) {
                    if (line) {
                        mythis.contents.push(line);
                    }
                });

                lineReader.on('close', function() {
                    resolve(mythis);
                });
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

        buildChapters: function(){
            mythis.chapters = {};
            var chap;
            for (var m in mythis.markers) {
                var marker = mythis.markers[m];
                if (marker.type === "chapter") {
                    chap = String("00" + marker.options).slice(-2);
                    var chapter =
                        mythis.chapters[chap] = {
                            id: chap,
                            verses: {}
                        };
                    //mythis.chapters.push(chapter);
                } else if (marker.type === "verse") {
                    mythis.chapters[chap].verses[marker.options] = {
                        id: marker.options,
                        contents: marker.contents
                    }
                } else if (marker.type === "heading") {
                    mythis.chapters['00'] = {
                        id: '00',
                        verses: {},
                        contents: marker.contents
                    };
                }
            }
            return mythis.chapters;
        }
    }
}

module.exports.ImportManager = ImportManager;
module.exports.UsfmParser = UsfmParser;
