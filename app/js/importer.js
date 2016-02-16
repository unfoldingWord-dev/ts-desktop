//importer module

'use strict';

var fs = require('fs'),
    path = require('path');

function Importer() {

    return {

        /**
         * Imports a zip file containing txt files in USFM format or a single txt file in USFM format
         * @param file {File} the path to the archive or txt file
         * @returns {Promise.<boolean>}
         */
        importUSFMFile: function (file) {
            console.log("importing USFM", file);
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
                            self.importSingleUSFMFile(txtFile);
                        }
                    });
                } else {
                    console.log("running single file import");
                    self.importSingleUSFMFile(file.path);
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

        importSingleUSFMFile: function (usfmFile, project) {

            //var projectPath = path.join(App.configurator.getValue('rootdir'),'targetTranslations','uw-mat-en');
            //var data = fs.readFileSync(usfmFile,'utf8');

            console.log("about to import", usfmFile);

            /*var lineReader = require('readline').createInterface({
                input: fs.createReadStream(usfmFile)
            });

            lineReader.on('line', function (line) {
                if (isMarker(line)) {
                    getMarker(line);
                }
            });*/

            var parser = new UsfmParser();
            parser.load(usfmFile).then(function(){
                console.log("Done loading");
                parser.parse();
            });
            //console.log(parser.contents);


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
                this.buildChapters();
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
            self.chapters = [];
            for(var m in self.markers){
                var marker = self.markers[m];
                if(marker.type === "chapter"){
                    var chapter = {
                        id: marker.options,
                        verses: []
                    }
                    self.chapters.push(chapter);
                } else if(marker.type === "verse"){
                    self.chapters[self.chapters.length - 1].verses.push({
                        id: marker.options,
                        contents: marker.contents
                    });
                }
            }
            console.log("chapters",self.chapters);
        }
    }
}

module.exports.Importer = Importer;
module.exports.UsfmParser = UsfmParser;
