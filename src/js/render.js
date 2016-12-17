'use strict';

var path = require('path');

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
            var vtest = new RegExp(/ ?[\\\/]v ?(?=\d)/g);
            var ctest = new RegExp(/ ?[\\\/]c ?(?=\d)/g);
            var vreplace = " \\v ";
            var creplace = "\\c ";

            text = text.replace(vtest, vreplace);
            text = text.replace(ctest, creplace);

            return text.trim();
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

        checkForConflicts: function (content) {
            var conflicttest = new RegExp(/(<{7} HEAD\n|={7}\n)([^<=>]+)(\n>{7} [\w]{40}|\n={7})/);
            var conarray = [];

            if (conflicttest.test(content)) {
                while (conflicttest.test(content)) {
                    var subcontent = conflicttest.exec(content)[2];
                    conarray.push(subcontent);
                    content = content.replace(subcontent, "");
                }
                return {exists: true, array: conarray};
            } else {
                return {exists: false, array: conarray};
            }
        },

        replaceEscapes: function (text) {
            text = text.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/\$/g, "\\$");
            text = text.replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\?/g, "\\?").replace(/\./g, "\\.").replace(/\//g, "\\/");
            text = text.replace(/\+/g, "\\+").replace(/\*/g, "\\*").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/\|/g, "\\|");

            return text;
        },

        replaceConflictCode: function (content) {
            var conflicts = this.checkForConflicts(content);
            var text = "";

            if (conflicts.exists) {
                text += "\n***Start of Conflict***\n";
                for (var i = 0; i < conflicts.array.length; i++) {
                    text += "***Option " + (i +1) + "***\n";
                    text += this.removeChapterMarkers(conflicts.array[i]) + "\n";
                }
                text += "***End of Conflict***\n";
                return text;
            } else {
                return content;
            }
        },

        renderPrintPreview: function (chunks, options) {
            var mythis = this;
            var module = "ts-print";
            var startheader = "\<h2 class='style-scope " + module + "'\>";
            var endheader = "\<\/h2\>";
            var add = "";
            if (options.doubleSpace) {
                add += "double ";
            }
            if (options.justify) {
                add += "justify ";
            }
            if (options.newpage) {
                add += "break ";
            }
            var startdiv = "\<div class='style-scope " + add + module + "'\>";
            var enddiv = "\<\/div\>";
            var chapters = [];
            var text = "\<div id='startnum' class='style-scope " + module + "'\>";

            _.forEach(_.groupBy(chunks, function(chunk) {
                return chunk.chunkmeta.chapter;
            }), function (data, chap) {
                var content = "";
                var title = "";

                _.forEach(data, function (chunk) {
                    if (chunk.chunkmeta.frameid === "title") {
                        title = chunk.transcontent || chunk.srccontent;
                    }
                    if (chunk.chunkmeta.frame > 0 && chunk.transcontent) {
                        if (options.includeIncompleteFrames || chunk.completed) {
                            content += mythis.replaceConflictCode(chunk.transcontent) + " ";
                        }
                    }
                });

                if (chap > 0) {
                    chapters.push({title: title, content: content.trim()});
                }
            });

            chapters.forEach(function (chapter) {
                if (chapter.content) {
                    text += startheader + chapter.title + endheader;
                    text += startdiv + mythis.renderTargetWithVerses(chapter.content, module) + enddiv;
                }
            });

            return text + enddiv;
        },

        renderObsPrintPreview: function (chunks, options, imagePath) {
            var module = "ts-print";
            var startheader = "\<h2 class='style-scope " + module + "'\>";
            var endheader = "\<\/h2\>";
            var startp = "\<p class='style-scope " + module + "'\>";
            var endp = "\<\/p\>";
            var add = "";
            if (options.doubleSpace) {
                add += "double ";
            }
            if (options.justify) {
                add += "justify ";
            }
            var startbreakdiv = "\<div class='style-scope break " + add + module + "'\>";
            var starttocdiv = "\<div class='style-scope double break toc " + module + "'\>";
            var starttitlediv1 = "\<div id='chap";
            var starttitlediv2 = "' class='style-scope break titles " + module + "'\>";
            var startnobreakdiv = "\<div class='style-scope nobreak " + module + "'\>";
            var enddiv = "\<\/div\>";
            var chapters = [];
            var text = "\<div id='startnum' class='style-scope " + module + "'\>";
            var toc = starttocdiv + startheader + "Table of Contents" + endheader;
            var startadiv1 = "\<div class='style-scope " + module + "'\>\<a class='style-scope " + module + "' href='#chap";
            var startadiv2 = "'\>";
            var endadiv = "\<\/a\>\<\/div\>";

            _.forEach(_.groupBy(chunks, function(chunk) {
                return chunk.chunkmeta.chapter;
            }), function (data, chap) {
                var content = "";
                var title = "";
                var ref = "";

                _.forEach(data, function (chunk) {
                    if (chunk.chunkmeta.frameid === "title") {
                        title = chunk.transcontent || chunk.srccontent;
                    }
                    if (chunk.chunkmeta.frameid === "reference") {
                        ref = chunk.transcontent || chunk.srccontent;
                    }
                    if (chunk.chunkmeta.frame > 0 && chunk.transcontent) {
                        if (options.includeIncompleteFrames || chunk.completed) {
                            if (options.includeImages) {
                                var image = path.join(imagePath, chunk.projectmeta.resource.id + "-en-" + chunk.chunkmeta.chapterid + "-" + chunk.chunkmeta.frameid + ".jpg");
                                content += startnobreakdiv + "\<img src='" + image + "'\>";
                                content += startp + chunk.transcontent + endp + enddiv;
                            } else {
                                content += chunk.transcontent + " ";
                            }
                        }
                    }
                });

                if (chap > 0) {
                    chapters.push({chapter: chap, title: title, reference: ref, content: content.trim()});
                }
            });

            chapters.forEach(function (chapter) {
                if (chapter.content) {
                    toc += startadiv1 + chapter.chapter + startadiv2 + chapter.title + endadiv;
                    text += starttitlediv1 + chapter.chapter + starttitlediv2 + startheader + chapter.title + endheader + startheader + chapter.reference + endheader + enddiv;
                    text += startbreakdiv + chapter.content + enddiv;
                }
            });

            toc += enddiv;

            return toc + text + enddiv;
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

            var addon = "";

            if (returnstr) {
                for (var k = 0; k < verses.length; k++) {
                    if (used.indexOf(verses[k]) < 0) {
                        addon += "\\v " + verses[k] + " ";
                    }
                }
            }

            return addon + returnstr;
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
