// renderer module

;(function () {
    'use strict';

    let _ = require('lodash');
    let paraRegExp = /<\/para>\s*/g;

    function paraPattern (paraType) {
        return new RegExp('<para\\s*style="' + paraType + '"\\s*>\\s*');
    }

    let renderer = {
        renderWhiteSpace: function (text) {
            return text.replace(/\s+/g, ' ');
        },
        renderLineBreaks: function (text) {
            return text.replace(/\s*\n+\s*/g, ' ');
        },
        renderNotes: function (text) {
            return text.replace(/\s*\n+\s*/g, ' ');
        },
        trimWhiteSpace: function (text) {
            return text.replace(/^\s*|\s*$/g, '');
        },
        renderVerse: function (text) {
            return text.replace(/<verse\s+number=\"(\d+(-\d+)?)\"\s+style=\"v\"\s*\/>/g, '');
        },
        renderVerseHTML: function (text) {
            let replacePre = '<span class="verse">',
                replacePost = '</span>';
            let output = text.replace(/<verse\s+number=\"(\d+(-\d+)?)\"\s+style=\"v\"\s*\/>/g,
                function (match) {
                    return replacePre + _.parseInt(match.slice(match.search('"') + 1), 10) +
                        replacePost;
                });
            return output;
        },
        renderParagraph: function (text) {
            let paraType = 'p',
                replacePara = paraPattern(paraType);
            return text.replace(replacePara, '').replace(paraRegExp, '');
        },
        renderParagraphHTML: function (text) {
            let paraType = 'p',
                replacePara = paraPattern(paraType);
            return text.replace(replacePara, '<p>').replace(paraRegExp, '</p>');
        },
        renderCleanFrameHTML: function (text) {
            return this.renderWhiteSpace(this.renderVerseHTML(this.renderParagraphHTML(text)));
        }
    };


    exports.renderWhiteSpace = renderer.renderWhiteSpace;
    exports.renderLineBreaks = renderer.renderLineBreaks;
    exports.trimWhiteSpace = renderer.trimWhiteSpace;
    exports.renderVerse = renderer.renderVerse;
    exports.renderParagraph = renderer.renderParagraph;
    exports.renderCleanFrameHTML = renderer.renderCleanFrameHTML;
    exports.renderVerseHTML = renderer.renderVerseHTML;
    exports.renderParagraphHTML = renderer.renderParagraphHTML;
}());
