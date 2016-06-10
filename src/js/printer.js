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
            var targetfont = configurator.getUserSetting('targetfont').path;
            if (targetfont === "default") {
                targetfont = defaultfont;
            }

            return new Promise(function (resolve, reject) {
                if (meta.project_type_class === "standard") {
                    // normalize input
                    var chapters = _.mapValues(_.groupBy(translation, function (obj) {
                        //console.debug('map chapter values', obj);
                        return obj.chunkmeta.chapterid;
                    }), function (chapter, key) {
                        var frames = _.mapKeys(chapter, function (obj) {
                            //console.debug('map chapter keys', obj);
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
                        chapterObj.frames = _.sortBy(_.filter(frames, function (o) {
                            return o.transcontent !== '';
                        }), function (f) {
                            //console.debug('sort frames',f);
                            return f.chunkmeta.frame;
                        });
                        return chapterObj;
                    });
                    var project = {
                        format: meta.format,
                        title: chapters['00'].title
                    };
                    delete chapters['00'];
                    project.chapters = _.sortBy(_.filter(chapters, function (o) {
                        return o.frames.length > 0;
                    }), 'id');
                    chapters = null;

                    if (project.format === 'markdown') {

                        var doc = new PDFDocument({
                            bufferPages: true,
                            margins:{
                                top: 72,
                                bottom: 50,
                                left: 72,
                                right: 72
                            }
                        });
                        doc.pipe(fs.createWriteStream(filePath));
                        // default meta
                        if (project.title.transcontent !== "") {
                            doc.info.Title = project.title.transcontent;
                        } else {
                            doc.info.Title = project.title.projectmeta.project.name;
                        }

                        //doc.info.Author = 'Joel Lonbeck'; // todo: translators
                        //doc.info.Subject = 'an unrestricted, visual mini-Bible in any language'; // todo: project sub-title
                        doc.info.Keywords = meta.target_language.name;

                        // book title
                        doc.fontSize(25)
                            .font(targetfont)
                            .text(doc.info.Title, 72, doc.page.height / 2, {align: 'center'});

                        mythis.renderLicense(doc, "OBS_LICENSE.md");

                        // TOC placeholders
                        doc.addPage();
                        var lastTOCPage = doc.bufferedPageRange().count;
                        var tocPages = {
                            start: lastTOCPage - 1
                        };
                        doc.fontSize(25)
                            .text(' ', 72, 72)
                            .moveDown();
                        _.forEach(project.chapters, function (chapter) {
                            doc.fontSize(10)
                                .text(' ')
                                .moveDown();
                            var currPage = doc.bufferedPageRange().count;
                            if (lastTOCPage !== currPage) {
                                // record toc page split
                                tocPages[chapter.id] = currPage - 1;
                                lastTOCPage = currPage;

                                // give room for header on new page
                                doc.fontSize(25)
                                    .text(' ', 72, 72)
                                    .moveDown();
                            }
                        });

                        // book body
                        _.forEach(project.chapters, function (chapter) {
                            // chapter title
                            doc.addPage();
                            doc.fontSize(20)
                                .text(chapter.title.transcontent || chapter.title.chunkmeta.title, 72, doc.page.height / 2, {align: 'center'});
                            chapter.page = doc.bufferedPageRange().count;

                            // frames
                            if (options.doubleSpace === true) {
                                doc.lineGap(20);
                            }
                            doc.addPage();
                            _.forEach(chapter.frames, function (frame) {
                                if (options.includeIncompleteFrames === true || frame.completed === true) {
                                    doc.moveDown();
                                    if (options.includeImages === true) {
                                        //console.debug(meta);
                                        //console.debug(frame);
                                        // TRICKY: right now all images are en
                                        var imgPath = path.join(imagePath, meta.resource.id + "-en-" + frame.chunkmeta.chapterid + "-" + frame.chunkmeta.frameid + ".jpg");
                                        //check the position of the text on the page.
                                        // 792 (total ht of page) - 50 ( lower margin) - 263.25 (height of pic) = 478.75 (max amount of space used before image)
                                        if (doc.y > 478.75) {
                                            doc.addPage();
                                        }
                                       doc.image(imgPath, {width:doc.page.width - 72*2});
                                    }
                                    doc.fontSize(10)
                                        .text(frame.transcontent);
                                    if (options.includeImages === true) {
                                        doc.moveDown();//add extra line break after image and text as per github issue527
                                    }
                                }
                            });

                            // chapter reference
                            if (chapter.reference !== null) {
                                doc.moveDown()
                                    .fontSize(10)
                                    .text(chapter.reference.transcontent);
                            }
                        });

                        // number pages
                        var range = doc.bufferedPageRange();
                        for (var i = range.start; i < range.start + range.count; i ++) {
                            doc.switchToPage(i);
                            doc.fontSize(10)
                                .font(defaultfont)
                                .text(i + 1, 72, doc.page.height - 50 - 12, {align: 'center'});
                        }

                        // write TOC
                        var currTocPage = tocPages.start;
                        doc.switchToPage(currTocPage);
                        // TODO: display correct title of TOC based on the project
                        doc.fontSize(25)
                            .lineGap(0)
                            .text('Table of Contents', 72, 72)
                            .font(targetfont)
                            .moveDown();
                        _.forEach(project.chapters, function (chapter) {
                            if (tocPages[chapter.id] !== undefined && tocPages[chapter.id] !== currTocPage) {
                                currTocPage = tocPages[chapter.id];
                                doc.switchToPage(currTocPage);
                                doc.fontSize(10)
                                    .text(' ')
                                    .moveUp();
                            }
                            doc.switchToPage(currTocPage);
                            doc.fontSize(10)
                                .text(chapter.title.transcontent || chapter.title.chunkmeta.title)
                                .moveUp()
                                .text(chapter.page + '', {align: 'right'})
                                .moveDown();
                        });

                        doc.end();
                        resolve(true);
                    } else if (project.format === 'usfm') {

                         var doc = new PDFDocument({
                            bufferPages: true,
                            margins:{
                                top: 72,
                                bottom: 50,
                                left: 72,
                                right: 72
                            }
                        });
                        doc.pipe(fs.createWriteStream(filePath));

                        //set the title
                        doc.info.Title = translation[0].transcontent || meta.project.name;
                        doc.fontSize(25)
                            .font(targetfont)
                            .text(doc.info.Title, 72, doc.page.height / 2, {align: 'center'});

                        mythis.renderLicense(doc, "LICENSE.md");

                             // book body
                        _.forEach(project.chapters, function (chapter) {

                            doc.addPage();//start each chapter on new page

                            //list chapters (remove leading zeros in the numbers)
                            var chapterNum = chapter.id.replace(/\b0+/, '');
                            doc.fontSize(20)
                                .lineGap(10)
                                .text(chapterNum + ' ', {continued: true});
                            chapter.page = doc.bufferedPageRange().count;

                            // frames
                            if (options.doubleSpace === true) {
                                doc.lineGap(20);
                            }

                            _.forEach(chapter.frames, function (frame) {
                                if (options.includeIncompleteFrames === true || frame.completed === true) {
                                    var content = frame.transcontent.split(/[\\]*[\\||\/][v][ ]([0-9]+)/g);

                                    _.forEach(content, function (info) {
                                        let output = info;
                                       //superscript for verses not supported by pdfkit: https://github.com/devongovett/pdfkit/issues/15
                                       output = output.replace(/[\\][\\c][ ][0-9]+ /g, '');
                                        doc.fontSize(10)
                                            .text(output + ' ',  { continued: true});
                                    });
                                }
                                doc.moveDown()
                                    .text("");
                            });
                        });

                        // number pages
                        var range = doc.bufferedPageRange();
                        for (var i = range.start; i < range.start + range.count; i ++) {
                            doc.switchToPage(i);
                            doc.fontSize(10)
                                .font(defaultfont)
                                .text(i + 1, 72, doc.page.height - 50 - 12, {align: 'center'});
                        }

                        doc.end();
                        resolve(true);
                    } else {
                        reject('We only support printing OBS and Bible projects for now');
                    }
                } else {
                    // TODO: support exporting other target translation types if needed e.g. notes, words, questions
                    reject('We do not support printing that project type yet');
                }
            });
        }
    };
}

module.exports.PrintManager = PrintManager;
