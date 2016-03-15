//importer module

'use strict';

var fs = require('fs'),
    path = require('path');

function Importer(configurator, pm) {

    return {

        /**
         * Imports a zip file containing txt files in USFM format or a single txt file in USFM format
         * @param file {File} the path to the archive or txt file
         * @returns {Promise.<boolean>}
         */
        importUSFMFile: function (file,translation) {
            console.log("importing USFM", file, "to project", translation);
            var self = this;
            return new Promise(function (resolve, reject) {
                let fileExt = file.name.split('.').pop().toLowerCase();
                console.log("File Extension: ", fileExt);
                if (fileExt === "zip") {
                    self.getTxtFilesFromZip(file).then(function (files) {
                        console.log("got files", files);
                        for (var i = 0; i < files.length; i++) {
                            let txtFile = files[i];
                            console.log("txt file", txtFile);
                            self.importSingleUSFMFile(txtFile,translation);
                        }
                    });
                } else {
                    console.log("running single file import");
                    self.importSingleUSFMFile(file.path,translation).then(function(data){
                        resolve();
                    }).catch(function(e){
                        reject('There was an error importing the translation');
                    });
                }
            });
        },

        getTxtFilesFromZip: function (zipFile) {
            console.log("getting txt files from zip");
            var tempDir = path.join(configurator.getValue('tempDir'), "usfm-import");

            return new Promise(function (resolve, reject) {
                let zip = new AdmZip(zipFile.path);
                console.log("zip object", zip);
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
            return parsedFrames;
        },

        importSingleUSFMFile: function (usfmFile, projdata) {
            let self = this;
            return new Promise(function(resolve,reject){
                var chunkFileNames = self.getVerseChunkFileNames(projdata);

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
                        chunkFileNames[i].completed = true;
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

                    pm.saveTargetTranslation(chunkFileNames,projdata).then(function(){
                        resolve();
                    }).catch(function(e){
                        reject('There was a problem importing this translation');
                        console.log('Save Error: ', e);
                    });
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
                console.log('about to read',self.file);

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
            console.log("Starting parse");
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
