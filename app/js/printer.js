'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    mkdirP = require('mkdirp'),
    rimraf = require('rimraf'),
    PDFDocument = require('pdfkit');


function Printer() {

    return {

        /**
         * Generates a pdf of the target translation
         * @param translation an array of frames
         * @param meta the target translation manifest and other info
         * @param filename the path where the export will be saved
         * @param options allows control over what is printed
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
                    // TRICKY: look into the first frame to see the format
                    if(translation[0].meta.format === 'default') {
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
                        let chapterPages = [];
                        doc.pipe(fs.createWriteStream(filename + '.pdf'));

                        // meta
                        doc.info.Title = meta.project_name; // todo: get translated project title
                        doc.info.Author = 'Joel Lonbeck'; // todo: translators
                        doc.info.Subject = 'an unrestricted, visual mini-Bible in any language'; // todo: project sub-title
                        doc.info.Keywords = meta.target_language.name;

                        // title
                        doc
                            .fontSize(25)
                            .text('Open Bible Stories', 72, doc.page.height / 2, {align: 'center'});

                        // TOC
                        doc.addPage();

                        let currentChapter = -1;
                        for(let frame of translation) {
                            if(frame.meta.chapter !== currentChapter) {
                                if(currentChapter !== -1) {
                                    // close chapter
                                    //frame.meta.reference
                                    // TODO: we need to get the chapter reference and insert it here
                                }

                                // start new chapter
                                doc.addPage()
                                    .fontSize(20)
                                    .text(frame.meta.title, 72, doc.page.height / 2, {align: 'center'});
                                chapterPages.push({
                                    title: frame.meta.title,
                                    page: doc.bufferedPageRange().count
                                });
                                currentChapter = frame.meta.chapter;
                            }

                            // chapter body
                            // TODO: check if frame is completed.
                            doc.addPage()
                                .fontSize(10);
                            // TODO: provide support for images
                            doc//.image('path to image', {width:doc.page.width - 72*2})
                                .moveDown()
                                .text(frame.transcontent);
                        }
                        if(currentChapter !== -1) {
                            // TODO: we need to get the chapter reference and insert it here
                            // close chapter
                            //frame.meta.reference
                        }

                        // number pages
                        let range = doc.bufferedPageRange();
                        for(let i = range.start; i < range.start + range.count; i ++) {
                            doc.switchToPage(i);
                            doc.text(i + 1, 72, doc.page.height - 50 - 12, {align: 'center'});

                            // write TOC
                            if(i === 1) {
                                // TODO: display correct title of TOC based on the project
                                doc.fontSize(25)
                                    .text('Table of Contents', 72, 72)
                                    .moveDown()
                                    .fontSize(10);
                                // TRICKY: skip title page and TOC
                                for(let chapterPage of chapterPages) {
                                    doc.text(chapterPage.title)
                                        .moveUp()
                                        .text(chapterPage.page, {align: 'right'})
                                        .moveDown();
                                }
                            }
                        }
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
