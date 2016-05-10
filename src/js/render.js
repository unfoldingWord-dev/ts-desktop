'use strict';

function Renderer() {

    return {

        convertVerseMarkers: function (text) {
            var startstr = '<verse number="';
            var endstr = '" style="v" />';
            var expression = new RegExp(startstr);
            var verses = [];

            while (expression.test(text)) {
                var versestr = text.substring(text.search(startstr) + 15, text.search(endstr));
                if (versestr.indexOf("-") < 0) {
                    verses.push(parseInt(versestr));
                } else {
                    var firstnum = parseInt(versestr.substring(0, versestr.search("-")));
                    var lastnum = parseInt(versestr.substring(versestr.search("-") + 1));
                    for (var j = firstnum; j <= lastnum; j++) {
                        verses.push(j);
                    }
                }
                text = text.replace(startstr, " \\v ");
                text = text.replace(endstr, " ");
            }
            return {text: text, verses: verses};
        },

        migrateMarkers: function (text) {
            var vtest1 = new RegExp(/\\v/g);
            var vtest2 = new RegExp(/\/v/g);
            var ctest = new RegExp(/\\c/g);
            var stest = new RegExp(/  /g);
            var vreplace = "\\v ";
            var creplace = "\\c ";
            var sreplace = " ";

            text = text.replace(vtest1, vreplace);
            text = text.replace(vtest2, vreplace);
            text = text.replace(ctest, creplace);
            text = text.replace(stest, sreplace);

            return text;
        },

        removeChapterMarkers: function (text) {
            var textarray = text.split(" ");
            var returnstr = "";

            for (var i = 0; i < textarray.length; i++) {
                if (textarray[i] === "\\c") {
                    i++;
                } else {
                    returnstr += textarray[i] + " ";
                }
            }

            return returnstr.trim();
        },

        renderMarkersAsSuper: function (text) {
            var textarray = text.split(" ");
            var numstr1 = "\<sup\>";
            var numstr2 = "\<\/sup\>";
            var returnstr = "";
            var verse = 0;

            for (var i = 0; i < textarray.length; i++) {
                if (textarray[i] === "\\v") {
                    verse = textarray[i+1];
                    returnstr += numstr1 + verse + numstr2;
                    i++;
                } else {
                    returnstr += textarray[i] + " ";
                }
            }
            return returnstr;
        }



    };
}

module.exports.Renderer = Renderer;
