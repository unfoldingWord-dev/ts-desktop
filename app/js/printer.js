'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    //path = require('path'),
    //mkdirP = require('mkdirp'),
    //rimraf = require('rimraf'),
    _ = require('lodash'),
    PDFDocument = require('pdfkit');


function Printer() {

    return {

        isTranslation: function (meta) {
            return !meta.project.type || meta.project.type === 'text';
        },

        /**
         * Generates a pdf of the target translation
         * @param translation an array of frames
         * @param meta the target translation manifest and other info
         * @param filename the path where the export will be saved
         * @param options {includeIncompleteFrames: boolean, includeImages: boolean}
         * @returns {Promise.<boolean>}
         */
        targetTranslationToPdf: function (translation, meta, filename, options) {
            // validate input
            if(filename === null || filename === '') {
                return Promise.reject('The filename is empty');
            }
            var isTranslation = this.isTranslation(meta);

            return new Promise(function(resolve, reject) {
                if(isTranslation) {
                    // normalize input
                    let chapters = _.mapValues(_.groupBy(translation, function(obj) {
                        return obj.meta.chapterid;
                    }), function(chapter, key) {
                        let frames = _.mapKeys(chapter, function(obj) {
                            return obj.meta.frameid;
                        });
                        let chapterObj = {
                            id: key,
                            title: frames.title,
                            reference: frames.reference === undefined ? null : frames.reference,
                            format: frames.title.meta.format // everyone has a title
                        };
                        delete frames.reference;
                        delete frames.title;
                        chapterObj.frames = _.sortBy(_.filter(frames, function(o) {
                            return o.transcontent !== '';
                        }), function(f) {
                            return f.meta.frame;
                        });
                        return chapterObj;
                    });
                    let project = {
                        format: chapters['00'].format,
                        title: chapters['00'].title
                    };
                    delete chapters['00'];
                    project.chapters = _.sortBy(_.filter(chapters, function(o) {
                        return o.frames.length > 0;
                    }), 'id');
                    chapters = null;


                    // TRICKY: look into the first chapter to see the format
                    if(project.format === 'default') {
                        // the default format is currently dokuwiki
                        let doc = new PDFDocument({
                            bufferPages: true,
                            margins:{
                                top: 72,
                                bottom: 50,
                                left: 72,
                                right: 72
                            }
                        });
                        doc.pipe(fs.createWriteStream(filename + '.pdf'));

                        // default meta
                        doc.info.Title = project.title.transcontent || meta.project.name;
                        doc.info.Author = 'Joel Lonbeck'; // todo: translators
                        //doc.info.Subject = 'an unrestricted, visual mini-Bible in any language'; // todo: project sub-title
                        doc.info.Keywords = meta.target_language.name;

                        // book title
                        doc.fontSize(25)
                            .text(project.title.transcontent, 72, doc.page.height / 2, {align: 'center'});

                        // TOC placeholders
                        doc.addPage();
                        let lastTOCPage = doc.bufferedPageRange().count;
                        let tocPages = {
                            start: lastTOCPage - 1
                        };
                        doc.fontSize(25)
                            .text(' ', 72, 72)
                            .moveDown();
                        _.forEach(project.chapters, function(chapter) {
                            doc.fontSize(10)
                                .text(' ')
                                .moveDown();
                            let currPage = doc.bufferedPageRange().count;
                            if(lastTOCPage !== currPage) {
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
                        _.forEach(project.chapters, function(chapter) {
                            // chapter title
                            doc.addPage();
                            doc.fontSize(20)
                                .text(chapter.title.transcontent || chapter.title.meta.title, 72, doc.page.height / 2, {align: 'center'});
                            chapter.page = doc.bufferedPageRange().count;

                            // frames
                            doc.addPage();
                            _.forEach(chapter.frames, function(frame) {
                                if(options.includeIncompleteFrames === true || frame.completed === true) {
                                    if (options.includeImages === true) {
                                        // TODO: get the image path
                                        //doc.image('path to image', {width:doc.page.width - 72*2})
                                        doc.fontSize(10)
                                            .text('[photo]', {align: 'center'});
                                    }
                                    doc.moveDown()
                                        .fontSize(10)
                                        .text(frame.transcontent);
                                }
                            });

                            // chapter reference
                            if(chapter.reference !== null) {
                                doc.moveDown()
                                    .fontSize(10)
                                    .text(chapter.reference.transcontent);
                            }
                        });

                        // number pages
                        let range = doc.bufferedPageRange();
                        for(let i = range.start; i < range.start + range.count; i ++) {
                            doc.switchToPage(i);
                            doc.fontSize(10)
                                .text(i + 1, 72, doc.page.height - 50 - 12, {align: 'center'});
                        }

                        // write TOC
                        let currTocPage = tocPages.start;
                        doc.switchToPage(currTocPage);
                        // TODO: display correct title of TOC based on the project
                        doc.fontSize(25)
                            .text('Table of Contents', 72, 72)
                            .moveDown();
                        _.forEach(project.chapters, function(chapter) {
                            if(tocPages[chapter.id] !== undefined && tocPages[chapter.id] !== currTocPage) {
                                currTocPage = tocPages[chapter.id];
                                doc.switchToPage(currTocPage);
                                doc.fontSize(10)
                                    .text(' ')
                                    .moveUp();
                            }
                            doc.switchToPage(currTocPage);
                            doc.fontSize(10)
                                .text(chapter.title.transcontent || chapter.title.meta.title)
                                .moveUp()
                                .text(chapter.page + '', {align: 'right'})
                                .moveDown();
                        });

                        doc.end();
                        resolve(true);
                    } else {
                        // we don't support anything but dokuwiki right now
                        reject('We only support exporting OBS projects for now');
                    }
                } else {
                    // TODO: support exporting other target translation types if needed e.g. notes, words, questions
                    reject('We do not support exporting that project type yet');
                }
            });
        }
    };
}

module.exports.Printer = Printer;
