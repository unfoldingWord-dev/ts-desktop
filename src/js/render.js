'use strict';

var path = require('path');
var fs = require('fs');
var markdown = require('markdown').markdown;

function Renderer() {

    return {

        renderMarkdown: function (text) {
            // TODO: this should be called when we open the resource, not when we load the project
            // rc://en/tw/dict/bible/kt/sin
            // rc://en/ta/man/translate/translate-names
            var html = markdown.toHTML(text.replace(/<br\s*\/?>/g, '\n'));
            return this.renderRelativeLinks(this.renderResourceContainerLinks(html));
        },

        /**
         * Searches for a markdown link that matches the link expression.
         * This will search for titled and anonymous links.
         * This will return null if no match is found
         */
        matchMarkdownLink: function(text, linkExpr) {
            const linkTest = new RegExp(`\\[\\[${linkExpr.source}]]`);
            const titledLinkTest = new RegExp(`\\[([^\\[\\]]+)]\\(${linkExpr.source}\\)`);
            if(linkTest.test(text)) {
                return {
                    title: null,
                    matches: linkTest.exec(text)
                };
            } else if(titledLinkTest.test(text)) {
                const match = titledLinkTest.exec(text);
                const title = match[1];
                match.splice(1, 1);
                return {
                    title: title,
                    matches: match
                };
            } else {
                return null;
            }
        },

        matchHtmlLink: function(text, linkExpr) {
            const linkTest = new RegExp(`<a[^><]+href="${linkExpr.source}"[^><]*>([^<]*)</a>`);
            if(linkTest.test(text)) {
                const match = linkTest.exec(text);
                const title = match[match.length -1];
                match.splice(match.length -1, 1);
                return {
                    title: title ? title : null,
                    matches: match
                };
            } else {
                return null;
            }
        },

        matchLink: function(text, linkExpr) {
            let match = this.matchHtmlLink(text, linkExpr);
            if(!match) {
                match = this.matchMarkdownLink(text, linkExpr);
            }
            return match;
        },

        /**
         * This renders relative passage links like ../php/01/21.md
         */
        renderRelativeLinks: function (text) {
            var bookTest = new RegExp(/(\.\.\/)+([a-z]+)\/(\d+)\/(\d+)\.md/);

            let bookMatch = this.matchLink(text, bookTest);
            while(bookMatch !== null) {
                const [match, relative, book, chapter, verse] = bookMatch.matches;
                let chapterNum = chapter;
                let verseNum = verse;
                try {
                    chapterNum = parseInt(chapter);
                    verseNum = parseInt(verse);
                } catch (e) {
                    console.warn('Failed to parse passage numbers in', match);
                }
                const title = bookMatch.title ? bookMatch.title : `${book} ${chapterNum}:${verseNum}`;
                // TRICKY: spoof resource type to ult
                const link = `<a href="#" data-link='ult/${book}/${chapter}/${verse}' class='style-scope rc-link link ts-resource-display biblelink' id='${chapter}:${verse}'>${title}</a>`;
                text = text.replace(match, link);
                bookMatch = this.matchLink(text, bookTest);
            }
            return text;
        },

        renderResourceContainerLinks: function (text) {
            // ta
            // rc://en/ta/man/translate/translate-names
            var taTest = new RegExp(/rc:\/\/([^\/]+)\/ta\/man\/([^\/]+)\/([^\/]+)/);
            // book
            // rc://en/ulb/book/gen/01/02
            var bookTest = new RegExp(/rc:\/\/([^\/]+)\/([^\/]+)\/book\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
            // words
            // rc://en/tw/dict/bible/kt/sin
            var wordTest = /rc:\/\/([^\/]+)\/tw\/dict\/bible\/([^\/]+)\/([^\/]+)/;

            let taMatch = this.matchLink(text, taTest);
            while (taMatch !== null) {
                const [match, lang, module, id] = taMatch.matches;
                const title = taMatch.title ? taMatch.title : id;
                const link = `<a href="#" data-link='${module}/${id}' class='style-scope rc-link link ts-resource-display talink' id='${id}'>${title}</a>`;
                text = text.replace(match, link);
                taMatch = this.matchLink(text, taTest);
            }

            let bookMatch = this.matchLink(text, bookTest);
            while (bookMatch !== null) {
                const [match, lang, res, book, chapter, verse] = bookMatch.matches;
                let chapterNum = chapter;
                let verseNum = verse;
                try {
                    chapterNum = parseInt(chapter);
                    verseNum = parseInt(verse);
                } catch (e) {
                    console.warn('Failed to parse passage numbers in', match);
                }
                const title = bookMatch.title ? bookMatch.title : `${book} ${chapterNum}:${verseNum}`;
                const link = `<a href="#" data-link='${res}/${book}/${chapter}/${verse}' class='style-scope rc-link link ts-resource-display biblelink' id='${chapter}:${verse}'>${title}</a>`;
                text = text.replace(match, link);
                bookMatch = this.matchLink(text, bookTest);
            }

            let wordMatch = this.matchLink(text, wordTest);
            while (wordMatch !== null) {//wordTest.test(text)) {
                const [match, lang, cat, slug] = wordMatch.matches;//wordTest.exec(text);
                const title = wordMatch.title ? wordMatch.title : slug;
                text = text.replace(match, `<a href="#" data-link="${cat}/${slug}" class="style-scope rc-link link ts-resource-display wordlink" id="${cat}/${slug}">${title}</a>`);
                wordMatch = this.matchLink(text, wordTest);
            }

            return text;
        },

        convertVerseMarkers: function (text) {
            var expression = new RegExp(/(\s*<verse[^<>\"]*\")(\d+-?\d*)(\"[^<>]*>)/);
            var verses = [];

            while (expression.test(text)) {
                var versestr = expression.exec(text)[2];

                if (versestr.indexOf("-") < 0) {
                    verses.push(parseInt(versestr));
                } else {
                    var firstnum = parseInt(versestr.substring(0, versestr.search("-")));
                    var lastnum = parseInt(versestr.substring(versestr.search("-") + 1));
                    for (var j = firstnum; j <= lastnum; j++) {
                        verses.push(j);
                    }
                }
                text = text.replace(expression, " \\v " + versestr + " ");
            }
            return {text: text, verses: verses};
        },

        convertNoteMarkers: function (text) {
            var expression = new RegExp(/(<note[^<>]*>)([^]+?)(<\/note>)/);

            while (expression.test(text)) {
                var notestr = expression.exec(text)[2];
                var tagtest = new RegExp(/<[^<>]*>/g);
                var quotetest = new RegExp(/(<char[^<>]*fqa">)([^]+?)(<\/char>)/);

                while (quotetest.test(notestr)) {
                    var quotestr = quotetest.exec(notestr)[2].trim();

                    notestr = notestr.replace(quotetest, '"' + quotestr + '" ');
                }

                notestr = notestr.replace(tagtest, "");
                notestr = notestr.replace(/'/g, '&apos;');

                var marker = "\<ts-note-marker text='" + notestr + "'\>\<\/ts-note-marker\>";

                text = text.replace(expression, marker);
            }
            return text;
        },

        removeParaTags: function (text) {
            var test = new RegExp(/<\/?para[^<>]*>/g);

            text = text.replace(test, "");

            return text.trim();
        },

        removeCharTags: function (text) {
            var test = new RegExp(/<\/?char[^<>]*>/g);

            text = text.replace(test, "");

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
            var expression = new RegExp(/\\c \d+\s+/g);

            return text.replace(expression, "");
        },

        renderSuperscriptVerses: function (text) {
            var expression = new RegExp(/(\\v )(\d+-?\d*)(\s+)/);

            while (expression.test(text)) {
                var versestr = expression.exec(text)[2];

                text = text.replace(expression, "\<sup\>" + versestr + "\<\/sup\>");
            }

            return text.trim();
        },

        renderParagraphs: function (text, module) {
            var expression = new RegExp(/([^>\n]*)([\n])/);
            var startp = "\<p class='style-scope " + module + "'\>";
            var endp = "\<\/p\>";

            text = text + "\n";

            while (expression.test(text)) {
                var paragraph = expression.exec(text)[1];

                if (!paragraph) {
                    paragraph = "&nbsp";
                }

                text = text.replace(expression, startp + paragraph + endp);
            }

            return text;
        },

        renderTargetWithVerses: function (text, module) {
            text = this.renderParagraphs(text, module);
            text = this.renderSuperscriptVerses(text);

            return text;
        },

        replaceConflictCode: function (text) {
            var starttest = new RegExp(/<{7} HEAD\n/g);
            var midtest = new RegExp(/={7}\n/g);
            var endtest = new RegExp(/>{7} \w{40}\n?/g);

            text = text.replace(starttest, "<S>");
            text = text.replace(midtest, "<M>");
            text = text.replace(endtest, "<E>");

            return text;
        },

        parseConflicts: function (text) {
            var conflicttest = new RegExp(/([^<>]*)(<S>)([^<>]*)(<M>)([^<>]*)(<E>)([^<>]*)/);
            var optiontest = new RegExp(/(@s@)([^]+?)(@e@)/);
            var confirmtest = new RegExp(/<(S|M|E)>/);
            var startmarker = "@s@";
            var endmarker = "@e@";
            var exists = false;
            var conarray = [];

            while (conflicttest.test(text)) {
                var pieces = conflicttest.exec(text);

                if (!optiontest.test(pieces[3])) {
                    pieces[3] = startmarker + pieces[3] + endmarker;
                }
                if (!optiontest.test(pieces[5])) {
                    pieces[5] = startmarker + pieces[5] + endmarker;
                }

                var newcontent = pieces[3] + pieces[5];

                if (pieces[1]) {
                    newcontent = newcontent.replace(/@s@/g, startmarker + pieces[1]);
                }
                if (pieces[7]) {
                    newcontent = newcontent.replace(/@e@/g, pieces[7] + endmarker);
                }

                text = text.replace(conflicttest, newcontent);
                exists = true;
            }

            if (exists) {
                while (optiontest.test(text)) {
                    var option = optiontest.exec(text)[2];

                    conarray.push(option.trim());
                    text = text.replace(optiontest, "");
                }

                conarray = _.uniq(conarray);
            }

            if (confirmtest.test(text)) {
                exists = true;
                conarray.push("Conflict Parsing Error");
            }

            return {exists: exists, array: conarray};
        },

        consolidateHelpsConflict: function (text) {
            var conflicttest = new RegExp(/^([^<>]*)(<S>)([^<>]*)(<M>)([^<>]*)(<E>)([^]*)/);
            var confirmtest = new RegExp(/<(S|M|E)>/);
            var errormsg = [{title: "Conflict Parsing Error", body: "Conflict Parsing Error"}];
            var start = "<S>";
            var middle = "<M>";
            var end = "<E>";
            var first = "";
            var second = "";

            if (conflicttest.test(text)) {
                while (conflicttest.test(text)) {
                    var pieces = conflicttest.exec(text);

                    first += pieces[1] + pieces[3];
                    second += pieces[1] + pieces[5];
                    text = pieces[7];
                }

                first += text;
                second += text;

                return start + first + middle + second + end;
            } else if (confirmtest.test(text)) {
                return start + errormsg + middle + errormsg + end;
            } else {
                return text;
            }
        },

        replaceEscapes: function (text) {
            text = text.replace(/\\/g, "\\\\").replace(/\[/g, "\\[").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/\$/g, "\\$");
            text = text.replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\?/g, "\\?").replace(/\./g, "\\.").replace(/\//g, "\\/");
            text = text.replace(/\+/g, "\\+").replace(/\*/g, "\\*").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/\|/g, "\\|");

            return text;
        },

        displayConflicts: function (content) {
            var conflicts = this.parseConflicts(this.replaceConflictCode(content));
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
                            content += mythis.displayConflicts(chunk.transcontent) + " ";
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
            var mythis = this;
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
                                // TRICKY: obs image names have changed to exclude the language id in the name
                                var image = path.join(imagePath, chunk.projectmeta.resource.id + "-" + chunk.chunkmeta.chapterid + "-" + chunk.chunkmeta.frameid + ".jpg");
                                if(!fs.existsSync(image)) {
                                    image = path.join(imagePath, chunk.projectmeta.resource.id + "-en-" + chunk.chunkmeta.chapterid + "-" + chunk.chunkmeta.frameid + ".jpg");
                                }
                                content += startnobreakdiv + "\<img src='" + image + "'\>";
                                content += startp + mythis.displayConflicts(chunk.transcontent) + endp + enddiv;
                            } else {
                                content += mythis.displayConflicts(chunk.transcontent) + " ";
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
                    text += starttitlediv1 + chapter.chapter + starttitlediv2 + startheader + chapter.title + endheader + enddiv;
                    text += startbreakdiv + chapter.content;
                    text += startp + chapter.reference + endp + enddiv;
                }
            });

            toc += enddiv;

            return toc + text + enddiv;
        },

        renderResource: function (data, module) {
            var starth2 = "\<h2 class='style-scope " + module + "'\>";
            var endh2 = "\<\/h2\>";
            var startdiv = "\<div class='style-scope " + module + "'\>";
            var enddiv = "\<\/div\>";

            if(data.type === 'Notes') {
                // TRICKY: notes are in markdown
                return starth2 + data.title + endh2 + startdiv + this.renderMarkdown(data.body) + enddiv;
            } else {
                // TRICKY: other resources have legacy links that need to be converted.
                return starth2 + data.title + endh2 + startdiv + this.renderRelativeLinks(this.renderResourceContainerLinks(this.renderResourceLinks(data.body, module))) + enddiv;
            }
        },

        renderResourceLinks: function (text, module) {
            var talinktest = new RegExp(/(\[\[:([^:]+):ta)(:[^:]*:[^:]*:)([^:\]]*)(\]\])/);
            var biblelinktest = new RegExp(/(\[\[:en:bible)(:[^:]*:)(\w*:\d*:\d*)(\|[^\]]*\]\])/);
            var wordlinktest = new RegExp(/<a\s+href="\.\.\/([^\/"]*)\/([^\/"]*).md"\s*>/);
            var linkname;
            var starta;
            var enda = "\<\/a\>";

            while (talinktest.test(text)) {
                var linkData = talinktest.exec(text);
                // var lang = linkData[2];
                linkname = linkData[4];
                var id = linkname;
                var name = linkname;

                if(linkname.indexOf('|') >= 0) {
                    // split title and id
                    [id, name] = linkname.split('|', 2);
                }
                id = id.replace(/_/g, "-").trim();
                name = name.trim();
                starta = "\<a href='" + id + "' class='style-scope link talink " + module + "' id='" + id + "'\>";

                text = text.replace(talinktest, starta + name + enda);
            }

            while (biblelinktest.test(text)) {
                linkname = biblelinktest.exec(text)[3];
                var chapter = parseInt(linkname.split(":")[1]);
                var verse = parseInt(linkname.split(":")[2]);

                starta = "\<a href='" + linkname + "' class='style-scope link biblelink " + module + "' id='" + chapter + ":" + verse + "'\>";

                text = text.replace(biblelinktest, starta + chapter + ":" + verse + enda);
            }

            while (wordlinktest.test(text)) {
                var parts = wordlinktest.exec(text);
                var cat = parts[1];
                id = parts[2];
                text = text.replace(parts[0], `<a href="${cat}/${id}" class="style-scope link wordlink ${module}" id="${cat}/${id}">`);
            }

            return text;
        },

        validateVerseMarkers: function (text, verses) {
            var returnstr = text.trim();
            var used = [];
            var addon = "";
            var versetest = new RegExp(/\s*\\v\s*(\d+)\s*/);
            var cleantest = new RegExp(/\\fv/g);

            while (versetest.test(returnstr)) {
                var versenum = parseInt(versetest.exec(returnstr)[1]);
                var replace = " ";

                if (verses.indexOf(versenum) >= 0 && used.indexOf(versenum) === -1) {
                    replace = " \\fv " + versenum + " ";
                    used.push(versenum);
                }
                returnstr = returnstr.replace(versetest, replace);
            }

            returnstr = returnstr.replace(cleantest, "\\v");

            if (returnstr) {
                for (var k = 0; k < verses.length; k++) {
                    if (used.indexOf(verses[k]) < 0) {
                        addon += "\\v " + verses[k] + " ";
                    }
                }
            }

            return addon + returnstr.trim();
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
