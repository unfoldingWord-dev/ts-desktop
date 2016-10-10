'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    utils = require('../js/lib/utils'),
    AdmZip = require('adm-zip'),
    https = require('https'),
    Prince = require('prince'),
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

        testPrince: function (data) {
            var input = path.join(imageRoot, 'test.html');
            var output = path.join(imageRoot, "prince.pdf");
            var cssPath = path.join(srcDir, 'css', 'print.css');
            var font = configurator.getUserSetting('targetfont').name;

            var header = '\<!DOCTYPE html\>\<html\>\<head\>\<link rel="stylesheet" href="' + cssPath + '"\>\<\/head\>\<body style="font-family: ' + font + ';"\>';
            var footer = '\<\/body\>\<\/html\>';

            fs.writeFileSync(input, header + data + footer);

            Prince().inputs(input)
                .output(output)
                .execute()
                .then(function () {
                    console.log("Finished");
                });

        },

        getLicense: function (filename) {
            return fs.readFileSync(path.join(srcDir, 'assets', filename), 'utf8');
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
            var font = path.join(srcDir, 'assets', 'NotoSans-Regular.ttf');
            var textgap = 10;
            var textsize = 10;
            var headersize = 25;
            var startpagenum = 0;
            var range = {};
            var justify = {};

            var doc = new PDFDocument({
                bufferPages: true,
                margins:{
                    top: 72,
                    bottom: 40,
                    left: 72,
                    right: 72
                }
            });

            doc.font(font);

            if (options.justify) {
                justify = {continued: true, align: 'justify'};
            } else {
                justify = {continued: true, align: 'left'};
            }

            if (options.doubleSpace) {
                textgap = textgap * 2;
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
                    reference: frames.reference === undefined ? null : frames.reference
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
                title: chapters['00'].title
            };
            delete chapters['00'];
            project.chapters = _.sortBy(_.filter(chapters, function (o) {
                return o.frames.length > 0;
            }), 'id');

            return new Promise(function (resolve, reject) {
                var writestream = fs.createWriteStream(filePath);

                writestream.on("error", function (err) {
                    reject("Cannot write to file. It may already be open.");
                });

                writestream.on("close", function () {
                    resolve(true);
                });

                if (project.id === 'obs') {
                    doc.pipe(writestream);

                    if (project.title.transcontent) {
                        doc.info.Title = project.title.transcontent;
                    } else {
                        doc.info.Title = project.title.projectmeta.project.name;
                    }

                    doc.fontSize(headersize);
                    doc.text(doc.info.Title, 72, doc.page.height / 2, {align: 'center'});

                    mythis.renderLicense(doc, "OBS_LICENSE.md");

                    doc.addPage();
                    var lastTOCPage = doc.bufferedPageRange().count;
                    var tocPages = {
                        start: lastTOCPage - 1
                    };
                    doc.fontSize(headersize);
                    doc.text(' ', 72, 72);
                    doc.moveDown();

                    _.forEach(project.chapters, function (chapter) {
                        doc.fontSize(textsize);
                        doc.text(' ');
                        doc.moveDown();
                        var currPage = doc.bufferedPageRange().count;
                        if (lastTOCPage !== currPage) {
                            tocPages[chapter.id] = currPage - 1;
                            lastTOCPage = currPage;

                            doc.fontSize(headersize);
                            doc.text(' ', 72, 72);
                            doc.moveDown();
                        }
                    });

                    _.forEach(project.chapters, function (chapter) {
                        doc.addPage();
                        doc.lineGap(textgap);
                        if (chapter.id === "01") {
                            startpagenum = doc.bufferedPageRange().count;
                        }
                        doc.fontSize(headersize);
                        doc.text(chapter.title.transcontent || chapter.title.chunkmeta.title, 72, doc.page.height / 2, {align: 'center'});
                        chapter.page = doc.bufferedPageRange().count;

                        if (chapter.reference) {
                            doc.moveDown();
                            doc.fontSize(textsize);
                            doc.text(chapter.reference.transcontent, {align: 'center'});
                        }

                        doc.addPage();
                        _.forEach(chapter.frames, function (frame) {
                            if (options.includeImages) {
                                var imgPath = path.join(imagePath, meta.resource.id + "-en-" + frame.chunkmeta.chapterid + "-" + frame.chunkmeta.frameid + ".jpg");
                                if (doc.y > 475) {
                                    doc.addPage();
                                }
                                doc.image(imgPath, {width: doc.page.width - 200});
                                doc.text("");
                            }
                            if (doc.y > 650) {
                                doc.text("");
                                doc.addPage();
                            }
                            doc.fontSize(textsize);
                            doc.text(frame.transcontent + ' ', justify);

                            if (options.includeImages) {
                                doc.moveDown();
                            }
                        });
                        doc.text("");
                    });

                    doc.text("");
                    doc.lineGap(0);
                    range = doc.bufferedPageRange();
                    for (var i = range.start; i < range.count; i++) {
                        if (i + 1 >= startpagenum) {
                            doc.switchToPage(i);
                            doc.fontSize(textsize);
                            doc.text(i + 2 - startpagenum, 72, doc.page.height - 60, {align: 'center'});
                        }
                    }

                    var currTocPage = tocPages.start;
                    doc.switchToPage(currTocPage);
                    doc.fontSize(headersize);
                    doc.text('Table of Contents', 72, 72);
                    doc.moveDown();

                    _.forEach(project.chapters, function (chapter) {
                        doc.fontSize(textsize);
                        if (tocPages[chapter.id] && tocPages[chapter.id] !== currTocPage) {
                            currTocPage = tocPages[chapter.id];
                            doc.switchToPage(currTocPage);
                            doc.text(' ');
                            doc.moveUp();
                        }
                        doc.switchToPage(currTocPage);
                        doc.text(chapter.title.transcontent || chapter.title.chunkmeta.title);
                        doc.moveUp();
                        doc.text(chapter.page - startpagenum + 1 + '', {align: 'right'});
                        doc.moveDown();
                    });
                    doc.end();
                } else {
                    doc.pipe(writestream);

                    doc.info.Title = translation[0].transcontent || meta.project.name;
                    doc.fontSize(headersize);
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
                        doc.fontSize(headersize);
                        doc.lineGap(textgap);
                        doc.text(chapterNum, {align: 'center'});
                        chapter.page = doc.bufferedPageRange().count;

                        _.forEach(chapter.frames, function (frame) {
                            var content = frame.transcontent.split(/[\\]*[\\||\/][v][ ]([0-9]+)/g);

                            _.forEach(content, function (info) {
                                var output = info.replace(/[\\][\\c][ ][0-9]+ /g, '');
                                if (doc.y > 650) {
                                    doc.text("");
                                    doc.addPage();
                                }
                                doc.fontSize(textsize);
                                doc.text(output + ' ', justify);
                            });
                        });
                    });

                    doc.text("");
                    doc.lineGap(0);
                    range = doc.bufferedPageRange();
                    for (var j = range.start; j < range.count; j++) {
                        if (j + 1 >= startpagenum) {
                            doc.switchToPage(j);
                            doc.fontSize(textsize);
                            doc.text(j + 2 - startpagenum, 72, doc.page.height - 60, {align: 'center'});
                        }
                    }
                    doc.end();
                }
            });
        }
    };
}

module.exports.PrintManager = PrintManager;
