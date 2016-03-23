//importer module

'use strict';

var fs = require('fs'),
    path = require('path'),
    request = require('request'),
    AdmZip = require('adm-zip');

function Importer(configurator, pm) {

    return {

        /**
         * Imports a zip file containing txt files in USFM format or a single txt file in USFM format
         * @param file {File} the path to the archive or txt file
         * @returns {Promise.<boolean>}
         */
        importUSFMFile: function (file,translation) {
            //console.log("importing USFM", JSON.stringify(file), "to project", JSON.stringify(translation));
            var self = this;
            return new Promise(function (resolve, reject) {
                let fileExt = file.name.split('.').pop().toLowerCase();
                //console.log("File Extension: ", fileExt);
                if (fileExt === "zip") {
                    self.getTxtFilesFromZip(file).then(function (files) {
                        //console.log("got files", files);
                        let txtFile = files[0];
                        var promise = self.importSingleUSFMFile(txtFile,translation);
                        for (var i = 1; i < files.length; i++) {
                            txtFile = files[i];
                            promise = promise.then(function(){
                                return self.importSingleUSFMFile(txtFile,translation);
                            });
                        }
                        promise.then(function(){
                            resolve();
                        }).catch(function(e){
                            console.log('Error', e.stack);
                            reject('There was an error importing the translation');
                        });;
                    });
                } else {
                    //console.log("running single file import");
                    self.importSingleUSFMFile(file.path,translation).then(function(data){
                        resolve();
                    }).catch(function(e){
                        console.log('Error', e.stack);
                        reject('There was an error importing the translation');
                    });
                }
            });
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
            return new Promise(function(resolve,reject){
                var book = projdata.project.id;
                var chunkDescUrl = "https://api.unfoldingword.org/bible/txt/1/" + book + "/chunks.json";
                var chunks = [];
                request(chunkDescUrl,function(err, resp, body){
                    if(!err){
                        var chunkDesc = JSON.parse(body);
                        for(var i = 0;i<chunkDesc.length;i++){
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
                                for(v;v<max;v++){
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

        /*getVerseChunkFileNames: function(projdata){
            return new Promise(function(resolve,reject){
                var frames = pm.getSourceFrames(projdata.source_translations[projdata.currentsource]);
                var parsedFrames = [],
                    chapters = {};

                for(var i = 0;i < frames.length;i++){
                    var sourcedata = frames[i].chunk,
                        verses = [],
                        startstr = '<verse number="',
                        endstr = '" style="v" />',
                        test = new RegExp(startstr);;

                    while (test.test(sourcedata)) {
                        var versestr = sourcedata.substring(sourcedata.search(startstr) + 15, sourcedata.search(endstr));
                        if (versestr.indexOf("-") < 0) {
                            verses.push(parseInt(versestr));
                        } else {
                            var firstnum = parseInt(versestr.substring(0, versestr.search("-")));
                            var lastnum = parseInt(versestr.substring(versestr.search("-") + 1));
                            for (var j = firstnum; j <= lastnum; j++) {
                                verses.push(j);
                            }
                        }
                        sourcedata = sourcedata.replace(startstr, " \\v");
                        sourcedata = sourcedata.replace(endstr, " ");
                    }

                    var chuckFile = String("00" + verses[0]).slice(-2);

                    parsedFrames.push({filename:chuckFile,chapter:frames[i].chapter,verses:verses});
                }
                resolve(parsedFrames);
            });
        },*/

        importSingleUSFMFile: function (usfmFile, projdata) {
            let self = this;
            return new Promise(function(resolve,reject){
                //var chunkFileNames = self.getVerseChunkFileNames(projdata);
                pm.loadTargetTranslation(projdata).then(function(curProj){
                    //console.log('curProj', curProj);
                    self.getVerseChunkFileNames(projdata).then(function(chunkFileNames){
                        var parser = new UsfmParser();
                        parser.load(usfmFile).then(function(){

                            var parsedData = parser.parse();
                            for(var i = 0;i<chunkFileNames.length;i++){
                                var chunk = chunkFileNames[i];
                                var transcontent = '';

                                for(var ci = 0;ci<chunk.verses.length;ci++){
                                    if(typeof parsedData[chunk.chapter] !== 'undefined' && typeof parsedData[chunk.chapter].verses[chunk.verses[ci]] !== 'undefined'){
                                        transcontent += '\\v' + parsedData[chunk.chapter].verses[chunk.verses[ci]].id + ' ' + parsedData[chunk.chapter].verses[chunk.verses[ci]].contents;
                                    }
                                }
                                chunkFileNames[i].meta = {
                                    chapterid: chunkFileNames[i].chapter,
                                    frameid: chunkFileNames[i].filename,
                                    helpscontent: []
                                };
                                if(transcontent === ''){
                                    var existing = curProj[chunkFileNames[i].chapter + '-' + chunkFileNames[i].filename];
                                    if(existing){
                                        chunkFileNames[i].completed = existing.completed;
                                        chunkFileNames[i].transcontent = existing.transcontent;
                                    } else {
                                        chunkFileNames[i].transcontent = null;
                                    }
                                } else {
                                    chunkFileNames[i].completed = true;
                                    chunkFileNames[i].transcontent = transcontent;
                                }
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

                            pm.saveTargetTranslation(chunkFileNames,projdata).then(function(){
                                resolve();
                            }).catch(function(e){
                                reject('There was a problem importing this translation');
                                console.log('Save Error: ', e);
                            });
                        });
                    });
                }).catch(function(e){
                    console.log('error', e);
                });

            });


        },

    }

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

    /*var isMarker = function (line) {
        if(typeof line !== "undefined"){
            return line.indexOf("\\") === 0;
        } else {
            return false;
        }
    };*/

    var getMarker = function (line) {
        var beginMarker = line.split(" ")[0];
        for (var type in markerTypes) {
            if (markerTypes[type].regEx.test(beginMarker)) {
                return markerTypes[type];
            }
            //console.log("marker type",type);
        }
        return false;
    };

    var self = this;

    return {
        load: function (file) {
            self.file = file;

            return new Promise(function(resolve,reject){
                //console.log('about to read',self.file);

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
            //console.log("Starting parse");
            try{
                this.getMarkers();
                return this.buildChapters();
            } catch(e){
                console.log(e.stack);
            }
        },
        getMarkers: function () {
            self.markers = [];
            self.markerCount = 0;
            var currentMarker = null;
            for (var i = 0; i < self.contents.length; i++) {
                var line = self.contents[i];
                var lineArray = line.split(" ");
                for(var c=0;c<lineArray.length;c++){
                    var section = lineArray[c];
                    var marker = getMarker(section);

                    if (marker) {
                        self.markers[self.markerCount] = {
                            type: marker.type,
                            line: line,
                            contents: ""
                        }
                        if(marker.hasOptions){
                            self.markers[self.markerCount].options = lineArray[c + 1];
                            c++;
                        }
                        var currentMarker = self.markers[self.markerCount];
                        self.markerCount++;
                    } else {
                        currentMarker.contents += section + " ";
                    }
                }
                /**
                 * THIS IS WHERE YOU LEFT OFF JEREMY!
                 */



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

module.exports.Importer = Importer;
module.exports.UsfmParser = UsfmParser;
