'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    mkdirP = require('mkdirp'),
    rimraf = require('rimraf');


var Git = require('../js/git').Git;
var git = new Git();

function zipper (r) {
    return r.length ? _.map(r[0].values, _.zipObject.bind(_, r[0].columns)) : [];
}

function wrap (module, fn) {
    var f = module ? module[fn] : fn;

    return function (arg1, arg2) {
        var args = typeof arg2 === 'undefined' ? [arg1] : [arg1, arg2];

        return new Promise(function (resolve, reject) {
            f.apply(module, args.concat(function (err, data) {
                return err ? reject(err) : resolve(data);
            }));
        });
    };
}

/**
 * NOTE: This is super meta.
 *
 * Reverses the order of arguments for a lodash (or equivalent) method,
 *  and creates a curried function.
 *
 */

function guard (method) {
    return function (cb) {
        var visit = typeof cb === 'function' ? function (v) { return cb(v); } : cb;
        return function (collection) {
            return _[method](collection, visit);
        };
    };
}

var map = guard('map'),
    indexBy = guard('indexBy'),
    flatten = guard('flatten'),
    filter = guard('filter'),
    compact = guard('compact');

/**
 *  var pm = ProjectsManager(query);
 *
 *  e.g. var pm = App.projectsManager;
 */

function ProjectsManager(query, configurator) {

    var puts = console.log.bind(console),
        write = wrap(fs, 'writeFile'),
        read = wrap(fs, 'readFile'),
        mkdirp = wrap(null, mkdirP),
        rm = wrap(null, rimraf),
        readdir = wrap(fs, 'readdir'),
        stat = wrap(fs, 'stat'),
        isDir = function (f) {
            return stat(f).then(function (s) {
                return s.isDirectory();
            });
        },
        isVisibleDir = function (f) {
            return isDir(f).then(function (isFolder) {
                var name = path.parse(f).name,
                    isHidden = /^\..*/.test(name);

                return (isFolder && !isHidden) ? f : false;
            });
        },
        filterDirs = function (dirs) {
            return Promise.all(_.map(dirs, isVisibleDir)).then(compact());
        },
        readdirs = function (dirs) {
            return Promise.all(_.map(dirs, function (d) {
                return readdir(d).then(map(function (f) {
                    return path.join(d, f);
                }));
            }));
        },
        toJSON = _.partialRight(JSON.stringify, null, '\t'),
        fromJSON = JSON.parse.bind(JSON),
        config = (function (prefix) {
            var isUW = _.partial(_.startsWith, _, prefix, 0),
                isChunk = function (filename) {
                    return _.endsWith(filename, '.txt');
                };

            return {
                filterProjects: _.partial(_.filter, _, isUW),

                filterChapters: filterDirs,

                filterChunks: _.partial(_.filter, _, isChunk),

                get targetDir () {
                    return configurator.getValue('targetTranslationsDir');
                },


                makeProjectPaths: function (meta) {
                    return this.makeProjectPathsForProject(prefix + meta.project.slug + '-' + meta.language.lc);
                },

                makeProjectPathsForProject: function (project) {
                    var targetDir = this.targetDir,
                        projectDir = path.join(targetDir, project);

                    return {
                        parentDir: targetDir,
                        projectDir: projectDir,
                        manifest: path.join(projectDir, 'manifest.json'),
                        translation: path.join(projectDir, 'translation.json'),
                        project: path.join(projectDir, 'project.json')
                    };

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
                    "select r.id, r.slug 'source', r.name, sl.name 'ln', sl.slug 'lc', p.slug 'project', r.checking_level 'level', r.version, r.modified_at 'date_modified' from resource r",
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
                    "select f.id, f.slug 'verse', f.body 'chunk', c.slug 'chapter', c.title from frame f",
                    "join chapter c on c.id=f.chapter_id",
                    "join resource r on r.id=c.resource_id",
                    "join source_language sl on sl.id=r.source_language_id",
                    "join project p on p.id=sl.project_id where r.id='" + s + "'",
                    "order by c.sort, f.sort"
                ].join(' '));

            return zipper(r);
        },

        checkProject: function (project) {
            var allsources = this.sources;
            var mysources = _.filter(allsources, 'project', project);
            var combined = {};
            var sources = [];
            for (var i = 0; i < mysources.length; i++) {
                var source = mysources[i].source;
                var frames = this.getSourceFrames(mysources[i]);
                console.log(source, frames.length);
                combined[source] = frames;
                sources.push(source);
            }
            console.log(combined);
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
                console.log("All chunks line up!");
            } else {
                console.log("First error occurs at " + firsterror);
            }

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
                "select w.term, w.definition from translation_word w",
                "join frame__translation_word f on w.id=f.translation_word_id",
                "where f.frame_id='" + frameid + "'"
            ].join(' '));

            return zipper(r);
        },

        getFrameQuestions: function (frameid) {

            var r = query([
                "select q.question, q.answer from checking_question q",
                "join frame__checking_question f on q.id=f.checking_question_id",
                "where f.frame_id='" + frameid + "'"
            ].join(' '));

            return zipper(r);
        },

        getPaths: function(meta) {
            return config.makeProjectPaths(meta);
        },

        saveTargetTranslation: function (translation, meta) {
            var paths = this.getPaths(meta);

            // save project.json and manifest.json

            // translation is an array
            // translation[0].meta.frameid

            var makeComplexId = function (c) {
                return c.meta.chapterid + '-' + c.meta.frameid;
            };

            var prop = function (prop) {
                return function (v, k) {
                    return v[prop] ? k : false
                };
            };

            var chunks = _.chain(translation)
                .indexBy(makeComplexId)
                .value();

            var finishedFrames = _.compact(_.map(chunks, prop('completed')));

            var sources = _.chain(meta.sources)
                .indexBy(function (r) {
                    return [r.project, r.lc, r.source].join('-');
                })
                .mapValues(function (r) {
                    return {
                        checking_level: r.level,
                        date_modified: r.date_modified,
                        version: r.version
                    };
                })
                .value();

            var manifest = {
                generator: {
                    name: 'ts-desktop'
                },
                package_version: 3,
                target_language: meta.language,
                project_id: meta.project.slug,
                source_translations: sources,
                translators: meta.translators,
                finished_frames: finishedFrames,
                finished_titles: [],
                finished_references: []
            };

            var writeFile = function (name, data) {
                return function () {
                    return write(name, toJSON(data));
                };
            };

            var makeChapterDir = function (c) {
                return mkdirp(path.join(paths.projectDir, c.meta.chapterid));
            };

            var makeChapterDirs = function (data) {
                return function () {
                    return Promise.all(_.map(data, makeChapterDir));
                };
            };

            var writeChunk = function (c) {
                var f = path.join(paths.projectDir, c.meta.chapterid, c.meta.frameid + '.txt');
                return write(f, c.content);
            };

            var writeChunks = function (data) {
                return function () {
                    return Promise.all(_.map(data, writeChunk));
                };
            };

            return mkdirp(paths.projectDir)
                .then(writeFile(paths.manifest, manifest))
                .then(writeFile(paths.project, meta))
                .then(makeChapterDirs(chunks))
                .then(writeChunks(chunks))
                .then(git.init.bind(git, paths.projectDir));
        },

        loadProjectsList: function () {
            return readdir(config.targetDir).then(config.filterProjects);
        },

        loadTargetTranslationsList: function () {
            var makePaths = config.makeProjectPathsForProject.bind(config);

            // return the project.json, not the manifest.json

            return this.loadProjectsList()
                       .then(map(makePaths))
                       .then(map('project'))
                       .then(map(read))
                       .then(Promise.all.bind(Promise))
                       .then(map(fromJSON));
        },

        loadFinishedFramesList: function (meta) {
            var paths = config.makeProjectPaths(meta);

            return read(paths.manifest).then(function (manifest) {
                var finishedFrames = fromJSON(manifest).finished_frames;
                return _.indexBy(finishedFrames);
            });
        },

        loadTargetTranslation: function (meta) {
            var paths = this.getPaths(meta);

            // read manifest, get object with finished frames

            // return an object with keys that are the complexid

            var parseChunkName = function (f) {
                var p = path.parse(f),
                    ch = p.dir.split(path.sep).slice(-1);

                return ch + '-' + p.name;
            };

            var readChunk = function (f) {
                return read(f).then(function (c) {
                    return {
                        content: c.toString(),
                        name: parseChunkName(f)
                    };
                })
            };

            var markFinished = function (chunks) {
                return function (finished) {
                    return _.mapValues(chunks, function (c, name) {
                        return {
                            content: c.content,
                            completed: !!finished[name]
                        }
                    });
                };
            };

            var makeFullPath = function (parent) {
                return function (f) {
                    return path.join(parent, f);
                };
            };

            return readdir(paths.projectDir)
                .then(map(makeFullPath(paths.projectDir)))
                .then(config.filterChapters)
                .then(flatten())
                .then(readdirs)
                .then(flatten())
                .then(map(readChunk))
                .then(Promise.all.bind(Promise))
                .then(indexBy('name'))
                .then(function (chunks) {
                    return this.loadFinishedFramesList(meta).then(markFinished(chunks));
                }.bind(this));
        },

        deleteTargetTranslation: function (meta) {
            var paths = this.getPaths(meta);

            return rm(paths.projectDir);
        }
    };
}

module.exports.ProjectsManager = ProjectsManager;
