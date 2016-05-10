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

        renderSourceWithVerses: function (text) {
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
            return returnstr.trim();
        },

        renderTargetWithVerses: function (text, module) {
            var linearray = text.split("\n");
            var numstr1 = "\<sup\>";
            var numstr2 = "\<\/sup\>";
            var startp = "\<p class='style-scope " + module + "'\>";
            var endp = "\<\/p\>";
            var returnstr = "";

            for (var j = 0; j < linearray.length; j++) {
                returnstr += startp;
                var wordarray = linearray[j].split(" ");
                for (var i = 0; i < wordarray.length; i++) {
                    if (wordarray[i] === "\\v") {
                        var verse = wordarray[i+1];
                        returnstr += numstr1 + verse + numstr2;
                        i++;
                    } else {
                        returnstr += wordarray[i] + " ";
                    }
                }
                returnstr = returnstr.trim();
                returnstr += endp;
            }
            return returnstr;
        },

        validateVerseMarkers: function (text, verses) {
            var linearray = text.split("\n");
            var returnstr = "";
            var used = [];

            for (var j = 0; j < linearray.length; j++) {
                var wordarray = linearray[j].split(" ");
                for (var i = 0; i < wordarray.length; i++) {
                    if (wordarray[i] === "\\v") {
                        var verse = parseInt(wordarray[i+1]);
                        if (verses.indexOf(verse) >= 0 && used.indexOf(verse) === -1) {
                            returnstr += "\\v " + verse + " ";
                            used.push(verse);
                        }
                        i++;
                    } else {
                        returnstr += wordarray[i] + " ";
                    }
                }
                returnstr = returnstr.trim();
                if (j !== linearray.length-1) {
                    returnstr += "\n";
                }
            }
            return returnstr;
        }



    };
}

module.exports.Renderer = Renderer;
