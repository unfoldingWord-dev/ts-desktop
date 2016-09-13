'use strict';

var _ = require('lodash');
var request = require('request');
var utils = require('../js/lib/utils');
var fs = require('fs-extra');
var path = require('path');
var yaml = require('js-yaml');

function zipper (r) {
    return r.length ? _.map(r[0].values, _.zipObject.bind(_, r[0].columns)) : [];
}

function DataManager(db, resourceDir, apiURL) {
    var query = db.query;
    var save = db.save;

    return {

        updateLanguageList: function () {
            var req = utils.promisify(request);

            return req({url: 'http://td.unfoldingword.org/exports/langnames.json', timeout: 60000})
                .then(function (response) {
                    return JSON.parse(response.body);
                })
                .then(function (newlist) {
                    var result = {};
                    var added = 0;
                    zipper(query('select slug from target_language')).forEach(function (item) {
                        result [item.slug] = true;
                    });

                    for (var i = 0; i < newlist.length; i++) {
                        var lc = newlist[i].lc;
                        var ln = newlist[i].ln;
                        var ld = newlist[i].ld;
                        var lr = newlist[i].lr;

                        if (!result[lc]) {
                            query('insert into target_language (slug, name, direction, region) values ("' + lc + '", "' + ln + '", "' + ld + '", "' + lr + '")');
                            added++;
                        }
                    }
                    return added;
                })
                .then(function (added) {
                    save();
                    return added;
                })
                .catch(function (err) {
                    console.log(err);
                    throw "Could not update language list";
                });
        },

        getTargetLanguages: function () {
            var list = db.indexSync.getTargetLanguages();

            return list.map(function (item) {
                return {id: item.slug, name: item.name, direction: item.direction};
            });
        },

        getProjects: function (lang) {
            return db.indexSync.getProjects(lang || 'en');
        },

        getResourcesByProject: function (project) {
            var mythis = this;
            var allres = db.indexSync.getResources(null, project);
            var filterres = allres.filter(function (item) {
                return item.type === 'book' && item.status.checking_level === "3";
            });

            return filterres.map(function (res) {
                return mythis.getSourceDetails(res.project_slug, res.source_language_slug, res.slug);
            });
        },

        openContainers: function (language, project, resource) {
            return db.openResourceContainer(language, project, resource)
                .then(function () {
                    return db.openResourceContainer(language, project, "tn")
                        .catch(function () {
                            return true;
                        });
                })
                .then(function () {
                    return db.openResourceContainer(language, project, "tq")
                        .catch(function () {
                            return true;
                        });
                })
                .then(function () {
                    return db.openResourceContainer(language, project, "udb")
                        .catch(function () {
                            return true;
                        });
                })
                .then(function () {
                    return db.openResourceContainer(language, "bible", "tw")
                        .catch(function () {
                            return true;
                        });
                });
        },

        closeAllContainers: function () {
            var allfiles = fs.readdirSync(resourceDir);
            var alldirs = allfiles.filter(function (file) {
                var stat = fs.statSync(path.join(resourceDir, file));
                return stat.isDirectory();
            });
            var promises = [];

            alldirs.forEach(function (dir) {
                var name = dir.split("_");
                var close = db.closeResourceContainer(name[0], name[1], name[2]);
                promises.push(close);
            });

            return Promise.all(promises);
        },

        extractContainer: function (language, project, resource) {
            var containername = language + "_" + project + "_" + resource;
            var contentpath = path.join(resourceDir, containername, "content");
            var data = [];

            try {
                var alldirs = fs.readdirSync(contentpath);
                var contentdirs = alldirs.filter(function (dir) {
                    var stat = fs.statSync(path.join(contentpath, dir));
                    return stat.isDirectory();
                });

                contentdirs.forEach(function (dir) {
                    var files = fs.readdirSync(path.join(contentpath, dir));

                    files.forEach(function (file) {
                        var filename = file.split(".")[0];
                        var content = fs.readFileSync(path.join(contentpath, dir, file), 'utf8');

                        if (dir === "front") {
                            dir = "00";
                        }

                        data.push({dir: dir, filename: filename, content: content});
                    });
                });

                return data;
            } catch (err) {
                return data;
            }
        },

        getProjectName: function (id) {
            var proj = db.indexSync.getProject('en', id);

            return proj.name;
        },

		getChunkMarkers: function (id) {
			var r = query([
				"select cm.chapter_slug 'chapter_slug', cm.first_verse_slug 'first_verse_slug'",
				"from chunk_marker as cm",
				"left join project as p on p.id=cm.project_id",
				"where p.slug='" + id + "'"
			].join(' '));
			return zipper(r);
		},

        getSources: function () {

        },

        getSourceDetails: function (project_id, language_id, resource_id) {
            var res = db.indexSync.getResource(language_id, project_id, resource_id);
            var lang = db.indexSync.getSourceLanguage(language_id);

            return {
                id: res.id,
                language_id: language_id,
                resource_id: resource_id,
                checking_level: res.status.checking_level,
                date_modified: res.status.pub_date,
                version: res.status.version,
                project_id: project_id,
                resource_name: res.name,
                language_name: lang.name,
                direction: lang.direction
            }
        },

        getSourceFrames: function (source) {
            var frames = this.extractContainer(source.language_id, source.project_id, source.resource_id);
            var toc = this.parseYaml(source, "toc.yml");
            var sorted = [];

            var mapped = frames.map(function (item) {
                return {chapter: item.dir, verse: item.filename, chunk: item.content};
            });

            toc.forEach (function (chapter) {
                var chunks = mapped.filter(function (item) {
                    return item.chapter === chapter.chapter;
                });
                chapter.chunks.forEach (function (chunk) {
                    sorted.push(chunks.filter(function (item) {
                        return item.verse === chunk;
                    })[0]);
                });
            });

            return sorted;
        },

        getSourceUdb: function (source) {
            if (source.resource_id === "ulb") {
                var frames = this.extractContainer(source.language_id, source.project_id, "udb");

                return frames.map(function (item) {
                    return {chapter: item.dir, verse: item.filename, chunk: item.content};
                });
            } else {
                return [];
            }
        },

        getSourceHelps: function (source, type) {
            var mythis = this;
            var frames = this.extractContainer(source.language_id, source.project_id, type);

            return frames.map(function (item) {
                return {chapter: item.dir, verse: item.filename, data: mythis.parseHelps(item.content)};
            });
        },

        getSourceWords: function (source) {
            var mythis = this;
            var config = this.parseYaml(source, "config.yml");
            var frames = this.extractContainer(source.language_id, "bible", "tw");

            var words = frames.map(function (item) {
                return {word: item.dir, data: mythis.parseHelps(item.content)[0]};
            });

            return {config: config.content, words: words};
        },

        parseHelps: function (content) {
            var array = [];
            var contentarray = content.split("\n\n");

            for (var i = 0; i < contentarray.length; i++) {
                array.push({title: contentarray[i].replace(/^#/, ''), body: contentarray[i+1]});
                i++;
            }

            return array;
        },

        parseYaml: function (source, filename) {
            var containername = source.language_id + "_" + source.project_id + "_" + source.resource_id;
            var filepath = path.join(resourceDir, containername, "content", filename);
            var file = fs.readFileSync(filepath, "utf8");
            var parsed = yaml.load(file);

            if (filename === "toc.yml" && parsed[0].chapter === "front") {
                parsed[0].chapter = "00";
            }

            return parsed;
        },

        getFrameWords: function (frameid) {
            var r = query([
                "select w.id, w.slug, w.term 'title', w.definition 'body', w.definition_title 'deftitle' from translation_word w",
                "join frame__translation_word f on w.id=f.translation_word_id",
                "where f.frame_id='" + frameid + "'"
            ].join(' '));

            return zipper(r);
        },

        getRelatedWords: function (wordid, source) {
            var s = typeof source === 'object' ? source.id : source;
            var r = query([
                "select w.id, w.term 'title', w.definition 'body', w.definition_title 'deftitle' from translation_word w",
                "join resource__translation_word x on x.translation_word_id=w.id",
                "join translation_word_related r on w.slug=r.slug",
                "where r.translation_word_id='" + wordid + "' and x.resource_id='" + s + "'",
                "order by lower(w.term)"
            ].join(' '));

            return zipper(r);
        },

        getAllWords: function (source) {
            var s = typeof source === 'object' ? source.id : source;
            var r = query([
                "select w.id, w.slug, w.term 'title', w.definition 'body', w.definition_title 'deftitle' from translation_word w",
                "join resource__translation_word r on r.translation_word_id=w.id",
                "where r.resource_id='" + s + "'",
                "order by lower(w.term)"
            ].join(' '));

            return zipper(r);
        },

        getWordExamples: function (wordid) {
            var r = query([
                "select cast(e.frame_slug as int) 'frame', cast(e.chapter_slug as int) 'chapter', e.body from translation_word_example e",
                "where e.translation_word_id='" + wordid + "'"
            ].join(' '));

            return zipper(r);
        },

        getTa: function (volume) {
            var r = query([
                "select t.id, t.slug, t.title, t.text 'body', t.reference from translation_academy_article t",
                "join translation_academy_manual m on m.id=t.translation_academy_manual_id",
                "join translation_academy_volume v on v.id=m.translation_academy_volume_id",
                "where v.slug like '" + volume + "'"
            ].join(' '));

            return zipper(r);
        },

        getVolumes: function () {
            var r = query([
                "select v.slug, v.title from translation_academy_volume v"
            ].join(' '));

            return zipper(r);
        },

        checkProject: function (project) {
            var allsources = this.getSources();
            var mysources = _.filter(allsources, 'project_id', project);
            var combined = {};
            var sources = [];
            for (var i = 0; i < mysources.length; i++) {
                var source = mysources[i].resource_id;
                var frames = this.getSourceFrames(mysources[i]);
                if (frames.length) {
                    console.log("resource:", source, "chunks:", frames.length);
                    combined[source] = frames;
                    sources.push(source);
                }
            }
            var match = true;
            var j = 0;
            while (match && j < combined[sources[0]].length) {
                var testref = combined[sources[0]][j].chapter + combined[sources[0]][j].verse;
                for (var k = 1; k < sources.length; k++) {
                    var checkref = combined[sources[k]][j].chapter + combined[sources[k]][j].verse;
                    if (testref !== checkref) {
                        match = false;
                        var firsterror = testref;
                    }
                }
                j++;
            }
            if (match) {
                console.log("                             ALL CHUNKS LINE UP!");
            } else {
                console.log("                             First error occurs at " + firsterror);
            }
            console.log("Data:");
            console.log(combined);
        },

        checkAllProjects: function () {
            var allsources = this.getSources();
            var ulbsources = _.filter(allsources, 'resource_id', 'ulb');
            for (var i = 0; i < ulbsources.length; i++) {
                console.log("Project Results              Name: " + ulbsources[i].project_id);
                this.checkProject(ulbsources[i].project_id);
                console.log("---------------------------------------------------------------");
            }
        }
    };
}

module.exports.DataManager = DataManager;
