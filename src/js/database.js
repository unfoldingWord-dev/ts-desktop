'use strict';

var _ = require('lodash');
var request = require('request');
var utils = require('../js/lib/utils');

function zipper (r) {
    return r.length ? _.map(r[0].values, _.zipObject.bind(_, r[0].columns)) : [];
}

function DataManager(db) {
    var query = db.query;
    var save = db.save;

    return {

        updateLanguageList: function () {
            var req = utils.promisify(request);

            return req('http://td.unfoldingword.org/exports/langnames.json')
                .then(function (response) {
                    return JSON.parse(response.body);
                })
                .then(function (newlist) {
                    query("delete from target_language");

                    for (var i = 0; i < newlist.length; i++) {
                        var lc = newlist[i].lc;
                        var ln = newlist[i].ln;
                        var ld = newlist[i].ld;
                        var lr = newlist[i].lr;
                        query('insert into target_language (slug, name, direction, region) values ("' + lc + '", "' + ln + '", "' + ld + '", "' + lr + '")');
                    }
                })
                .then(function () {
                    save();
                })
                .catch(function (err) {
                    console.log(err);
                    throw "Could not update language list";
                });
        },

        getTargetLanguages: function () {
            var r = query("select slug 'id', name, direction from target_language order by lower(slug)");
            return zipper(r);
        },

        getProjects: function (lang) {
            var r = query([
                    "select p.id, p.slug, sl.project_name 'name', sl.project_description 'desc', c.category_name 'category' from project p",
                    "join source_language sl on sl.project_id=p.id",
                    "left join source_language__category c on c.source_language_id=sl.id",
                    "where sl.slug='" + (lang || 'en') + "'",
                    "order by p.sort"
                ].join(' '));
            return zipper(r);
        },

        getProjectName: function (id) {
            var r = query([
                "select sl.project_name 'name' from project p",
                "join source_language sl on sl.project_id=p.id",
                "where sl.slug='en' and p.slug='" + id + "'"
            ].join(' '));
            return zipper(r);
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
            var r = query([
                    "select r.id, r.slug 'resource_id', r.name 'resource_name', l.name 'language_name', l.direction, l.slug 'language_id', p.slug 'project_id', r.checking_level, r.version, r.modified_at 'date_modified' from resource r",
                    "join source_language l on l.id=r.source_language_id",
                    "join project p on p.id=l.project_id",
                    "order by r.name"
                ].join(' '));
            return zipper(r);
        },

        getSourceDetails: function (project_id, language_id, resource_id) {
            var r = query([
                "select r.id, r.name 'resource_name', l.name 'language_name', l.direction, p.slug 'project_id' from resource r",
                "join source_language l on l.id=r.source_language_id",
                "join project p on p.id=l.project_id",
                "where p.slug='" + project_id + "' and l.slug='" + language_id + "' and r.slug='" + resource_id + "'"
            ].join(' '));
            return zipper(r);
        },

        getSourceFrames: function (source) {
            var s = typeof source === 'object' ? source.id : source,
                r = query([
                    "select f.id, f.slug 'verse', f.body 'chunk', c.slug 'chapter', c.title, c.reference, f.format from frame f",
                    "join chapter c on c.id=f.chapter_id",
                    "join resource r on r.id=c.resource_id",
                    "join source_language sl on sl.id=r.source_language_id",
                    "join project p on p.id=sl.project_id where r.id='" + s + "'",
                    "order by c.sort, f.sort"
                ].join(' '));

            return zipper(r);
        },

        getFrameUdb: function (source, chapterid, verseid) {
            var sources = this.getSources();
            var udbsource = _.filter(sources, {'language_id': source.language_id, 'project_id': source.project_id, 'checking_level': 3, 'resource_id': 'udb'});
            var s = udbsource[0].id,
                r = query([
                    "select f.id, f.slug 'verse', f.body 'chunk', c.slug 'chapter', c.title, c.reference, f.format from frame f",
                    "join chapter c on c.id=f.chapter_id",
                    "join resource r on r.id=c.resource_id",
                    "join source_language sl on sl.id=r.source_language_id",
                    "join project p on p.id=sl.project_id where r.id='" + s + "' and c.slug='" + chapterid + "' and f.slug='" + verseid + "'"
                ].join(' '));

            return zipper(r);
        },

        getFrameNotes: function (frameid) {
                var r = query([
                    "select title, body from translation_note",
                    "where frame_id='" + frameid + "'"
                ].join(' '));

            return zipper(r);
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

        getFrameQuestions: function (frameid) {
            var r = query([
                "select q.question 'title', q.answer 'body' from checking_question q",
                "join frame__checking_question f on q.id=f.checking_question_id",
                "where f.frame_id='" + frameid + "'"
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
