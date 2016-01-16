'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    mkdirP = require('mkdirp'),
    rimraf = require('rimraf'),
    AdmZip = require('adm-zip'),
    archiver = require('archiver'),
    utils = require('../js/lib/util'),
    tstudioMigrator = require('../js/migration/tstudioMigrator'),
    targetTranslationMigrator = require('../js/migration/targetTranslationMigrator'),
    wrap = utils.promisify,
    guard = utils.guard;

var Git = require('../js/git').Git;
var git = new Git();

function zipper (r) {
    return r.length ? _.map(r[0].values, _.zipObject.bind(_, r[0].columns)) : [];
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
                    return this.makeProjectPathsForProject(prefix + meta.fullname);
                },

                makeProjectPathsForProject: function (project) {
                    var targetDir = this.targetDir,
                        projectDir = path.join(targetDir, project);

                    return {
                        parentDir: targetDir,
                        projectDir: projectDir,
                        manifest: path.join(projectDir, 'manifest.json'),
                        translation: path.join(projectDir, 'translation.json'),
                        ready: path.join(projectDir, 'READY'),
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
            var r = query("select slug 'id', name, direction from target_language order by slug");
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

        getProjectName: function (id) {
            var r = query([
                "select sl.project_name 'name' from project p",
                "join source_language sl on sl.project_id=p.id",
                "where sl.slug='en' and p.slug='" + id + "'",
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

        getSourceDetails: function (source) {
            var id = source.split('-');
            var r = query([
                "select r.id, r.slug 'source', r.name, sl.name 'ln', sl.slug 'lc', p.slug 'project', r.checking_level 'level', r.version, r.modified_at 'date_modified' from resource r",
                "join source_language sl on sl.id=r.source_language_id",
                "join project p on p.id=sl.project_id",
                "where p.slug='" + id[0] + "' and sl.slug='" + id[1] + "' and r.slug='" + id[2] + "'"
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
                    "select f.id, f.slug 'verse', f.body 'chunk', c.slug 'chapter', c.title, f.format from frame f",
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
                console.log("source:", source, "chunks:", frames.length);
                combined[source] = frames;
                sources.push(source);
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
            var allsources = this.sources;
            var ulbsources = _.filter(allsources, 'source', 'ulb');
            for (var i = 0; i < ulbsources.length; i++) {
                console.log("Project Results              Name: " + ulbsources[i].project);
                this.checkProject(ulbsources[i].project);
                console.log("---------------------------------------------------------------");
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
                "select w.id, w.term, w.definition, w.definition_title 'title' from translation_word w",
                "join frame__translation_word f on w.id=f.translation_word_id",
                "where f.frame_id='" + frameid + "'"
            ].join(' '));

            return zipper(r);
        },

        getRelatedWords: function (wordid) {

            var r = query([
                "select w.id, w.term, w.definition, w.definition_title 'title' from translation_word w",
                "join translation_word_related r on w.slug=r.slug",
                "where r.translation_word_id='" + wordid + "'"
            ].join(' '));

            return zipper(r);
        },

        getAllWords: function () {

            var r = query([
                "select w.id, w.term, w.definition, w.definition_title 'title' from translation_word w",
                "order by w.term"
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
                "select q.question, q.answer from checking_question q",
                "join frame__checking_question f on q.id=f.checking_question_id",
                "where f.frame_id='" + frameid + "'"
            ].join(' '));

            return zipper(r);
        },

        getPaths: function(meta) {
            return config.makeProjectPaths(meta);
        },

        createReadyFile: function (meta) {
            var paths = this.getPaths(meta);

            return write(paths.ready, (new Date()).toString());
        },

        backupTranslation: function (meta, filename, name) {
            var paths = this.getPaths(meta);
            return new Promise(function(resolve, reject) {
                var source = paths.projectDir;
                var output = fs.createWriteStream(filename + ".tstudio");
                var archive = archiver.create('zip', {});

                var manifest = {
                    generator: {
                        name: 'ts-desktop',
                        build: ''
                    },
                    package_version: 2,
                    timestamp: '',
                    target_translations: [{path: name, id: name, commit_hash: '', direction: "ltr"}]
                };

                archive.pipe(output);
                archive.directory(source, name + "/");
                archive.append(toJSON(manifest), {name: 'manifest.json'});
                archive.finalize();

                resolve(true);
            });
        },

        /**
         *
         * @param translation an array of frames
         * @param meta the target translation manifest and other info
         * @param filename the path where the export will be saved
         * @returns {Promise.<boolean>}
         */
        exportTranslation: function (translation, meta, filename) {
            // validate input
            if(filename === null || filename === '') {
                return Promise.reject('The filename is empty');
            }
            var isTranslation = this.isTranslation(meta);

            return new Promise(function(resolve, reject) {
                if(isTranslation) {
                    // TRICKY: look into the first frame to see the format
                    if(translation[0].meta.format === 'default') {
                        // the default format is currently dokuwiki
                        let chapterContent = '',
                            currentChapter = -1,
                            zip = new AdmZip(),
                            numFinishedFrames = 0;
                        for(let frame of translation) {

                            // close chapter chapter
                            if(frame.meta.chapter !== currentChapter) {
                                if(chapterContent !== '' && numFinishedFrames > 0) {
                                    // TODO: we need to get the chapter reference and insert it here
                                    chapterContent += '////\n';
                                    //console.log('chapter ' + currentChapter, chapterContent);
                                    zip.addFile(currentChapter + '.txt', new Buffer(chapterContent), null);
                                }
                                currentChapter = frame.meta.chapter;
                                chapterContent = '';
                                numFinishedFrames = 0;
                            }

                            if(frame.transcontent !== '') {
                                numFinishedFrames ++;
                            }

                            // build chapter header
                            if(chapterContent === '') {
                                chapterContent += '//\n';
                                chapterContent += meta.target_language.name + '\n';
                                chapterContent += '//\n\n';

                                chapterContent += '//\n';
                                chapterContent += meta.project_name + '\n';
                                chapterContent += '//\n\n';

                                chapterContent += '//\n';
                                chapterContent += frame.meta.title + '\n';
                                chapterContent += '//\n\n';
                            }

                            // add frame
                            chapterContent += '{{https://api.unfoldingword.org/' + meta.project_id + '/jpg/1/en/360px/' + meta.project_id + '-' + meta.target_language.id + '-' + frame.meta.chapterid + '-' + frame.meta.frameid + '.jpg}}\n\n';
                            chapterContent += frame.transcontent + '\n\n';
                        }
                        if(chapterContent !== '' && numFinishedFrames > 0) {
                            // TODO: we need to get the chapter reference and insert it here
                            chapterContent += '////\n';
                            zip.addFile(currentChapter + '.txt', new Buffer(chapterContent), null);
                        }

                        if(zip.getEntries().length > 0) {
                            zip.writeZip(filename + '.zip');
                            resolve(true);
                        } else {
                            // there was nothing to export
                            reject('There was nothing to export');
                        }
                    } else {
                        // we don't support anything but dokuwiki right now
                        reject('We only support exporting OBS projects for now');
                    }
                } else {
                    // TODO: support exporting other target translation types if needed e.g. notes, words, questions
                    reject('We do not support exporting that project type yet');
                }
            });
        },

        /**
         * Imports a tstudio archive
         * @param file {File} the path to the archive
         * @returns {Promise.<boolean>}
         */
        importTargetTranslation: function(file) {
            console.log('importing archive', file);
            return new Promise(function(resolve, reject) {
                tstudioMigrator.listTargetTranslations(file).then(function(relativePaths) {
                    if(relativePaths.length > 0) {
                        // proceed to import
                        let zip = new AdmZip(file.path);
                        _.forEach(relativePaths, function(tpath) {
                            let outputDir = path.join(configurator.getValue('tempDir'), tpath);
                            //zip.extractEntryTo(tpath + '/*', outputDir, false, true);
                            zip.extractAllTo(outputDir, true);
                             targetTranslationMigrator.migrate(outputDir + "/" + tpath).then(function() {
                                // import the target translation
                                // TODO: need to use the id not the path
                                utils.move(outputDir + "/" + tpath, path.join(configurator.getValue('targetTranslationsDir'), tpath), function(err) {
                                    if(err) {
                                        console.log(err);
                                    } else {
                                        console.log('finished importing target translation');
                                    }
                                });
                            })
                            .catch(function(err) {
                                console.log(err);
                            });
                        });
                        console.log('finished importing');
                        resolve(true);
                    } else {
                        reject('The archive is empty or not supported');
                    }
                })
                .catch(function(err) {
                    reject(err);
                });
            });
        },

        isTranslation: function (meta) {
            return !meta.project_type || meta.project_type === 'text';
        },

        saveTargetTranslation: function (translation, meta) {
            var paths = this.getPaths(meta);

            // translation is an array
            // translation[0].meta.frameid

            var makeComplexId = function (c) {
                return c.meta.chapterid + '-' + c.meta.frameid;
            };

            var prop = function (prop) {
                return function (v, k) {
                    return v[prop] ? k : false;
                };
            };

            var isTranslation = this.isTranslation(meta);

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
                target_language: meta.target_language,
                project_id: meta.project_id,
                project_type: meta.project_type,
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

            var updateChunk = function (c) {
                var f = path.join(paths.projectDir, c.meta.chapterid, c.meta.frameid + '.txt'),
                    hasContent = isTranslation ? !!c.transcontent : !!c.helpscontent.length;

                return hasContent ? write(f, isTranslation ? c.transcontent : toJSON(c.helpscontent)) : rm(f);
            };

            var updateChunks = function (data) {
                return function () {
                    return Promise.all(_.map(data, updateChunk));
                };
            };

            return mkdirp(paths.projectDir)
                .then(writeFile(paths.manifest, manifest))
                .then(makeChapterDirs(chunks))
                .then(updateChunks(chunks))
                .then(git.init.bind(git, paths.projectDir))
                .then(git.stage.bind(git, paths.projectDir));
        },

        loadProjectsList: function () {
            return readdir(config.targetDir).then(config.filterProjects);
        },

        loadTargetTranslationsList: function () {
            var makePaths = config.makeProjectPathsForProject.bind(config);

            return this.loadProjectsList()
                       .then(map(makePaths))
                       .then(map('manifest'))
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

            var isTranslation = this.isTranslation(meta);

            // read manifest, get object with finished frames

            // return an object with keys that are the complexid

            var parseChunkName = function (f) {
                var p = path.parse(f),
                    ch = p.dir.split(path.sep).slice(-1);

                return ch + '-' + p.name;
            };

            var readChunk = function (f) {
                return read(f).then(function (c) {
                    var parsed = {
                        name: parseChunkName(f)
                    };

                    if (isTranslation) {
                        parsed['transcontent'] = c.toString();
                    } else {
                        parsed['helpscontent'] = JSON.parse(c);
                    }

                    return parsed;
                });
            };

            var markFinished = function (chunks) {
                return function (finished) {
                    return _.mapValues(chunks, function (c, name) {
                        var mapped = {
                            completed: !!finished[name]
                        },
                        key = isTranslation ? 'transcontent' : 'helpscontent';

                        mapped[key] = c[key];

                        return mapped;
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
