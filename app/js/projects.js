'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    mkdirP = require('mkdirp'),
    puts = console.log.bind(console);

function zipper (r) {
    return r.length ? _.map(r[0].values, _.zipObject.bind(_, r[0].columns)) : [];
}

function go (module, fn) {
    var args = [].slice.call(arguments, 2),
        f = module ? module[fn] : fn;

    return new Promise(function (resolve, reject) {
      f.apply(module, args.concat(function (err, data) {
        return err ? reject(err) : resolve(data);
      }));
    });
}

/**
 *  var pm = ProjectsManager(db);
 *
 *  e.g. var pm = App.projectsManager;
 */

function ProjectsManager(db, configurator) {

    var query = db.exec.bind(db),
        write = go.bind(null, fs, 'writeFile'),
        read = go.bind(null, fs, 'readFile'),
        mkdirp = go.bind(null, null, mkdirP),
        readdir = go.bind(null, fs, 'readdir'),
        toJSON = _.partialRight(JSON.stringify, null, '\t'),
        config = (function (prefix) {
            var isUW = _.partial(_.startsWith, _, prefix, 0);

            return {
                filterDirs: _.partial(_.filter, _, isUW),

                get targetDir () {
                    return configurator.getValue('targetTranslationsDir');
                },

                makeProjectPath: function (proj, lang) {
                    return path.join(this.targetDir, prefix + proj.slug + '-' + lang.lc);
                }
            };
        })('uw-');

    return {
        /**
         *  var l = pm.targetLanguages,
         *      africanLangs = _.filter(l, 'region', 'Africa'),
         *      europeanLangs = _.filter(l, 'region', 'Europe'),
         *      en = _.find(l, 'lc', 'en');
         */

        get targetLanguages () {
            var r = query("select id, slug 'lc', name 'ln', direction, region from target_language order by slug");
            return zipper(r);
        },

        /**
         *  var projects = pm.getProjects('en');
         *
         *  Defaults to English ('en'). This is equivalent:
         *    var projects = pm.getProjects();
         *
         *  var grouped = _.groupBy(projects, 'category'),
         *      partitioned = _.partition(projects, 'category');
         */

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

        /**
         *  var sources = pm.sources,
         *      englishSources = _.filter(sources, 'lc', 'en'),
         *      genesisSources = _.filter(sources, 'project', 'gen'),
         *      enGenSources = _.filter(sources, {'lc': 'en', 'project': 'gen'});
         */

        get sources () {
            var r = query([
                    "select r.id, r.slug 'source', r.name, sl.name 'ln', sl.slug 'lc', p.slug 'project', r.checking_level, r.version from resource r",
                    "join source_language sl on sl.id=r.source_language_id",
                    "join project p on p.id=sl.project_id",
                    "order by r.name"
                ].join(' '));
            return zipper(r);
        },

        /**
         *  var frames = pm.getSourceFrames(source),
         *      groupedByChapter = _(frames).groupBy('chapter').values().sortBy('0.chapter').value();
         *
         *  var getFrames = pm.getSourceFrames.bind(null, source),
         *      s1 = getFrames('udb'),
         *      s2 = getFrames('ulb');
         */

        getSourceFrames: function (source) {
            var s = typeof source === 'object' ? source.id : source,
                r = query([
                    "select f.id, f.body 'chunk', c.slug 'chapter', c.title from frame f",
                    "join chapter c on c.id=f.chapter_id",
                    "join resource r on r.id=c.resource_id",
                    "join source_language sl on sl.id=r.source_language_id",
                    "join project p on p.id=sl.project_id where r.id='" + s + "'",
                    "order by f.id, f.sort"
                ].join(' '));

            return zipper(r);
        },

        saveTargetTranslation: function (translation, meta) {
            var projectPath = config.makeProjectPath(meta.project, meta.language),
                manifestPath = path.join(projectPath, 'manifest.json'),
                translationPath = path.join(projectPath, 'translation.json');

            return mkdirp(projectPath).then(function () {
                return write(manifestPath, toJSON(meta));
            }).then(function () {
                return write(translationPath, toJSON(translation));
            });
        },

        loadTargetTranslationsList: function () {
            return readdir(config.targetDir).then(config.filterDirs);
        },

        loadTargetTranslation: function (targetTranslation) {
            return read('filepath').then(puts);
        }
    };
}

module.exports.ProjectsManager = ProjectsManager;
