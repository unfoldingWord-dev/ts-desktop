'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    utils = require('../js/lib/utils'),
    AdmZip = require('adm-zip'),
    https = require('https'),
    PDFDocument = require('pdfkit');

function PrintManager(configurator) {

    var download = utils.download;
    var srcDir = path.resolve(path.join(__dirname, '..'));
    var imageRoot = path.join(configurator.getValue('rootdir'), 'images');
    var imagePath = path.join(imageRoot, 'obs');
    var zipPath = path.join(imageRoot, 'obs-images.zip');
    var server = "https://api.unfoldingword.org/";
    var url = server + 'obs/jpg/1/en/obs-images-360px.zip';

    return {

        downloadImages: function () {
            return utils.fs.mkdirs(imagePath)
                .then(function () {
                    return utils.fs.stat(zipPath).then(utils.ret(true)).catch(utils.ret(false));
                })
                .then(function (fileExists) {
                    return fileExists ? true : download(url, zipPath, true);
                });
        },

        extractImages: function () {
            var zip = new AdmZip(zipPath);
            zip.extractAllTo(imagePath, true);

            var directories = fs.readdirSync(imagePath).filter(function (file) {
                return fs.statSync(path.join(imagePath, file)).isDirectory();
            });
            directories.forEach(function (dir) {
                var dirPath = path.join(imagePath, dir);
                var files = fs.readdirSync(dirPath);
                files.forEach(function (file) {
                    var filePath = path.join(imagePath, dir, file);
                    var newPath = path.join(imagePath, file);
                    fs.renameSync(filePath, newPath);
                });
                fs.rmdirSync(dirPath);
            });
        },

        renderLicense: function (doc, filename) {
            var filePath = path.join(srcDir, 'assets', filename);
            var lines = fs.readFileSync(filePath).toString().split('\n');

            doc.addPage();
            doc.lineGap(0);
            lines.forEach(function (line) {
                var fontsize = 9;
                var indent = 72;
                if (line.startsWith("## ")) {
                    fontsize = 14;
                } else if (line.startsWith("### ")) {
                    fontsize = 11;
                } else if (line.startsWith("**")) {
                    indent = 100;
                }
                doc.fontSize(fontsize);
                doc.text(line.replace(/#+ /, "").replace(/\*\*/g, ""), indent);
                doc.fontSize(5);
                doc.moveDown();
            });
        },

        targetTranslationToPdf: function (translation, meta, filePath, options) {
            var mythis = this;
            if(filePath.split('.').pop() !== 'pdf') {
                filePath += '.pdf';
            }
            var defaultfont = path.join(srcDir, 'assets', 'NotoSans-Regular.ttf');
            var pagenumfont = ("Helvetica");            
            var startpagenum = 0;
            var range = {};
            var justify = {};
            var i = 0;

            var doc = new PDFDocument({
                bufferPages: true,
                margins:{
                    top: 72,
                    bottom: 50,
                    left: 72,
                    right: 72
                }
            });

            if (options.justify) {
                justify = {continued: true, align: 'justify'};
            } else {
                justify = {continued: true, align: 'left'};
            }

            var chapters = _.mapValues(_.groupBy(translation, function (obj) {
                return obj.chunkmeta.chapterid;
            }), function (chapter, key) {
                var frames = _.mapKeys(chapter, function (obj) {
                    return obj.chunkmeta.frameid;
                });

                var chapterObj = {
                    id: key,
                    title: frames.title || key,
                    reference: frames.reference === undefined ? null : frames.reference,
                    format: meta.format
                };
                delete frames.reference;
                delete frames.title;

                if (options.includeIncompleteFrames) {
                    chapterObj.frames = _.sortBy(_.filter(frames, function (o) {
                        return o.transcontent !== '';
                    }), function (f) {
                        return f.chunkmeta.frame;
                    });
                } else {
                    chapterObj.frames = _.sortBy(_.filter(frames, function (o) {
                        return o.completed;
                    }), function (f) {
                        return f.chunkmeta.frame;
                    });
                }

                return chapterObj;
            });

            var project = {
                id: meta.project.id,
                format: meta.format,
                title: chapters['00'].title
            };
            delete chapters['00'];
            project.chapters = _.sortBy(_.filter(chapters, function (o) {
                return o.frames.length > 0;
            }), 'id');
            
            return new Promise(function (resolve, reject) {
                if (project.id === 'obs') {
                    doc.pipe(fs.createWriteStream(filePath));
                    
                    if (project.title.transcontent !== "") {
                        doc.info.Title = project.title.transcontent;
                    } else {
                        doc.info.Title = project.title.projectmeta.project.name;
                    }

                    doc.fontSize(25);
                    doc.font(defaultfont);
                    doc.text(doc.info.Title, 72, doc.page.height / 2, {align: 'center'});

                    mythis.renderLicense(doc, "OBS_LICENSE.md");

                    doc.addPage();
                    var lastTOCPage = doc.bufferedPageRange().count;
                    var tocPages = {
                        start: lastTOCPage - 1
                    };
                    doc.fontSize(25);
                    doc.text(' ', 72, 72);
                    doc.moveDown();

                    _.forEach(project.chapters, function (chapter) {
                        doc.fontSize(10);
                        doc.text(' ');
                        doc.moveDown();
                        var currPage = doc.bufferedPageRange().count;
                        if (lastTOCPage !== currPage) {
                            // record toc page split
                            tocPages[chapter.id] = currPage - 1;
                            lastTOCPage = currPage;

                            doc.fontSize(25);
                            doc.text(' ', 72, 72);
                            doc.moveDown();
                        }
                    });

                    _.forEach(project.chapters, function (chapter) {                        
                        doc.addPage();
                        if (chapter.id === "01") {
                            startpagenum = doc.bufferedPageRange().count;
                        }
                        doc.lineGap(10);
                        doc.fontSize(20);
                        doc.text(chapter.title.transcontent || chapter.title.chunkmeta.title, 72, doc.page.height / 2, {align: 'center'});
                        chapter.page = doc.bufferedPageRange().count;
                        
                        if (chapter.reference) {
                            doc.moveDown();
                            doc.fontSize(10);
                            doc.text(chapter.reference.transcontent, {align: 'center'});
                        }

                        if (options.doubleSpace) {
                            doc.lineGap(20);
                        }
                        doc.addPage();
                        _.forEach(chapter.frames, function (frame) {
                            if (options.includeImages) {
                                var imgPath = path.join(imagePath, meta.resource.id + "-en-" + frame.chunkmeta.chapterid + "-" + frame.chunkmeta.frameid + ".jpg");
                                //check the position of the text on the page.
                                // 792 (total ht of page) - 50 ( lower margin) - 263.25 (height of pic) = 478.75 (max amount of space used before image)
                                if (doc.y > 478.75) {
                                    doc.addPage();
                                }
                                doc.image(imgPath, {width: doc.page.width - 72*2});
                            }
                            if (doc.y > 650) {
                                doc.text("");
                                doc.addPage();
                            }
                            doc.fontSize(10);
                            doc.text(frame.transcontent + ' ', justify);

                            if (options.includeImages) {
                                doc.moveDown();
                            }
                        });
                        doc.text("");
                    });

                    doc.text("");
                    range = doc.bufferedPageRange();
                    for (i = range.start; i < range.count; i ++) {
                        if (i + 1 >= startpagenum) {
                            doc.switchToPage(i);
                            doc.fontSize(10);
                            doc.font(pagenumfont);
                            doc.text(i + 2 - startpagenum, 72, doc.page.height - 50 - 12, {align: 'center'});
                        }
                    }

                    var currTocPage = tocPages.start;
                    doc.switchToPage(currTocPage);                    
                    doc.fontSize(25);
                    doc.lineGap(0);
                    doc.text('Table of Contents', 72, 72);
                    doc.font(defaultfont);
                    doc.moveDown();
                    
                    _.forEach(project.chapters, function (chapter) {
                        if (tocPages[chapter.id] && tocPages[chapter.id] !== currTocPage) {
                            currTocPage = tocPages[chapter.id];
                            doc.switchToPage(currTocPage);
                            doc.fontSize(10);
                            doc.text(' ');
                            doc.moveUp();
                        }
                        doc.switchToPage(currTocPage);
                        doc.fontSize(10);
                        doc.text(chapter.title.transcontent || chapter.title.chunkmeta.title);
                        doc.moveUp();
                        doc.text(chapter.page - startpagenum + 1 + '', {align: 'right'});
                        doc.moveDown();
                    });

                    doc.end();
                    resolve(true);
                    
                } else {
                    doc.pipe(fs.createWriteStream(filePath));

                    doc.info.Title = translation[0].transcontent || meta.project.name;
                    doc.fontSize(25);
                    doc.font(defaultfont);
                    doc.text(doc.info.Title, 72, doc.page.height / 2, {align: 'center'});

                    mythis.renderLicense(doc, "LICENSE.md");

                    _.forEach(project.chapters, function (chapter) {
                        if (chapter.id === "01" || options.newpage) {
                            doc.addPage();
                            doc.text("");
                        } else {
                            doc.moveDown();
                            doc.text("");
                        }

                        if (chapter.id === "01") {
                            startpagenum = doc.bufferedPageRange().count;
                        }

                        var chapterNum = chapter.id.replace(/\b0+/, '');
                        if (doc.y > 600) {
                            doc.text("");
                            doc.addPage();
                        }
                        doc.fontSize(20);
                        doc.lineGap(10);
                        doc.text(chapterNum, {align: 'center'});
                        chapter.page = doc.bufferedPageRange().count;

                        if (options.doubleSpace) {
                            doc.lineGap(20);
                        }

                        _.forEach(chapter.frames, function (frame) {
                            var content = frame.transcontent.split(/[\\]*[\\||\/][v][ ]([0-9]+)/g);

                            _.forEach(content, function (info) {                                
                                var output = info.replace(/[\\][\\c][ ][0-9]+ /g, '');
                                if (doc.y > 650) {
                                    doc.text("");
                                    doc.addPage();
                                }
                                doc.fontSize(10);
                                doc.text(output + ' ', justify);
                            });                            
                        });
                    });

                    doc.text("");
                    range = doc.bufferedPageRange();
                    for (i = range.start; i < range.count; i ++) {
                        if (i + 1 >= startpagenum) {
                            doc.switchToPage(i);
                            doc.fontSize(10);
                            doc.font(pagenumfont);
                            doc.text(i + 2 - startpagenum, 72, doc.page.height - 50 - 12, {align: 'center'});
                        }
                    }

                    doc.end();
                    resolve(true);
                }
            });
        }
    };
}

module.exports.PrintManager = PrintManager;
