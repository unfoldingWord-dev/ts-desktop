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

        convertNoteMarkers: function (text) {
            var startstr = '<note';
            var endstr = '<\/note>';
            var expression = new RegExp(startstr);

            while (expression.test(text)) {
                var notestr = this.removeUsxMarkers(text.substring(text.search(startstr), text.search(endstr)));
                var marker = "\<ts-note-marker text='" + notestr + "'\>\<\/ts-note-marker\>";

                text = text.replace(/<note[^]*note>/, marker);
            }
            return text;
        },

        removeUsxMarkers: function (text) {
            var mtest = new RegExp(/<[^<>]*>/g);
            var stest = new RegExp(/  /g);
            var mreplace = " ";
            var sreplace = " ";

            text = text.replace(mtest, mreplace);
            text = text.replace(stest, sreplace);

            return text.trim();
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
                if (linearray[j] === "") {
                    returnstr += "&nbsp";
                } else {
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
                }
                returnstr += endp;
            }
            return returnstr;
        },

        validateVerseMarkers: function (text, verses) {
            var linearray = text.trim().split("\n");
            var returnstr = "";
            var used = [];

            for (var j = 0; j < linearray.length; j++) {
                if (linearray[j] === "") {
                    if (linearray.length === 1) {
                        returnstr += "";
                    } else {
                        returnstr += "\n";
                    }                    
                } else {
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
            }
            return returnstr;
        },

        markersToBalloons: function (chunk, module) {
            var verses = chunk.chunkmeta.verses;
            var chap = chunk.chunkmeta.chapter;
            var linearray = chunk.transcontent.split("\n");
            var vmstr1 = "\<ts-verse-marker id='c";
            var vmstr2 = "v";
            var vmstr3 = "' draggable='true' class='markers' verse='";
            var vmstr4 = "'\>\<\/ts-verse-marker\>";
            var textstr1 = "\<span class='targets style-scope " + module + "'\>";
            var textstr2 = "\<\/span\> ";
            var startp = "\<p class='style-scope " + module + "'\>";
            var endp = "\<\/p\>";
            var returnstr = "";
            var prestr = startp;
            var used = [];

            for (var j = 0; j < linearray.length; j++) {
                if (j !== 0) {
                    returnstr += startp;
                }
                if (linearray[j] === "") {
                    returnstr += "&nbsp";
                } else {
                    var wordarray = linearray[j].split(" ");
                    for (var i = 0; i < wordarray.length; i++) {
                        if (wordarray[i] === "\\v") {
                            var verse = parseInt(wordarray[i+1]);
                            if (verses.indexOf(verse) >= 0 && used.indexOf(verse) === -1) {
                                returnstr += vmstr1 + chap + vmstr2 + verse + vmstr3 + verse + vmstr4;
                                used.push(verse);
                            }
                            i++;
                        } else {
                            returnstr += textstr1 + wordarray[i] + textstr2;
                        }
                    }
                }
                returnstr += endp;
            }
            for (i = 0; i < verses.length; i++) {
                if (used.indexOf(verses[i]) === -1) {
                    prestr += vmstr1 + chap + vmstr2 + verses[i] + vmstr3 + verses[i] + vmstr4;
                }
            }
            return prestr + returnstr;
        },

        balloonsToMarkers: function (paragraphs) {
            var returnstr = "";

            for (var j = 0; j < paragraphs.length; j++) {
                var children = paragraphs[j].children;
                if (!children.length) {
                    returnstr += "\n";
                } else {
                    for (var i = 0; i < children.length; i++) {
                        var type = children[i].nodeName;

                        if (type === "TS-VERSE-MARKER") {
                            var versenum = children[i].verse;
                            returnstr += "\\v " + versenum + " ";
                        } else {
                            var text = children[i].textContent;
                            returnstr += text + " ";
                        }
                    }
                    returnstr = returnstr.trim();
                    if (j !== paragraphs.length-1) {
                        returnstr += "\n";
                    }
                }
            }
            return returnstr;
        }

    };
}

module.exports.Renderer = Renderer;
