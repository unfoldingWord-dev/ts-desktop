'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    mkdirP = require('mkdirp'),
    rimraf = require('rimraf'),
    AdmZip = require('adm-zip'),
    archiver = require('archiver'),
    utils = require('../js/lib/util'),
    git = require('../js/git')(),
    migrator = require('../js/migrator'),
    wrap = utils.promisify,
    guard = utils.guard;

var map = guard('map'),
    indexBy = guard('indexBy'),
    flatten = guard('flatten'),
    compact = guard('compact');

/**
 *  var pm = ProjectsManager(query);
 *
 *  e.g. var pm = App.projectsManager;
 */

function ProjectsManager(dataManager, configurator, srcDir) {

    // var puts = console.log.bind(console),  // Never used
    var write = wrap(fs, 'writeFile'),
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
        // NOTE: Old auto-backup implementation
        // backupTimer,
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
                    var filename = meta.unique_id;
                    return this.makeProjectPathsForProject(filename);
                },

                makeProjectPathsForProject: function (project) {
                    var targetDir = this.targetDir,
                        projectDir = path.join(targetDir, project);

                    return {
                        parentDir: targetDir,
                        projectDir: projectDir,
                        manifest: path.join(projectDir, 'manifest.json'),
                        license: path.join(projectDir, 'LICENSE.md')
                    };

                }
            };
        })('uw-');

    return {

        getPaths: function(meta) {
            return config.makeProjectPaths(meta);
        },

        migrateBackup: function(oldPath, newPath) {
            utils.move(path.join(oldPath, 'automatic_backups'), path.join(newPath, 'automatic_backups'), {clobber: true});
            utils.move(path.join(oldPath, 'backups'), path.join(newPath, 'backups'), {clobber: true});
        },

        isTranslation: function (meta) {
            return !meta.type.id || meta.type.id === 'text';
        },

        updateManifestToMeta: function (manifest) {
            var meta = manifest;
            try {
                if (manifest.project.name === "") {
                    meta.project.name = dataManager.getProjectName(manifest.project.id)[0].name;
                }

                if (manifest.type.name === "" && manifest.type.id === "text") {
                    meta.type.name = "Text";
                }

                for (var j = 0; j < manifest.source_translations.length; j++) {
                    var details = dataManager.getSourceDetails(manifest.project.id, manifest.source_translations[j].language_id, manifest.source_translations[j].resource_id)[0];
                    meta.source_translations[j].project_id = details.project_id;
                    meta.source_translations[j].id = details.id;
                    meta.source_translations[j].language_name = details.language_name;
                    meta.source_translations[j].resource_name = details.resource_name;
                }

                if (manifest.source_translations.length) {
                    meta.currentsource = 0;
                } else {
                    meta.currentsource = null;
                }

                if (manifest.type.id === "tw" || manifest.type.id === "ta") {
                    meta.project_type_class = "extant";
                } else if (manifest.type.id === "tn" || manifest.type.id === "tq") {
                    meta.project_type_class = "helps";
                } else {
                    meta.project_type_class = "standard";
                }

                meta.unique_id = manifest.target_language.id + "_" + manifest.project.id + "_" + manifest.type.id;
                if (manifest.resource.id !== "") {
                    meta.unique_id += "_" + manifest.resource.id;
                }

                var completion = App.configurator.getValue(meta.unique_id + "-completion");
                if (completion !== undefined && completion !== "") {
                    meta.completion = completion;
                } else {
                    if (manifest.source_translations.length) {
                        var frames = dataManager.getSourceFrames(manifest.source_translations[0]);
                        meta.completion = Math.round((meta.finished_chunks.length / frames.length) * 100);
                    } else {
                        meta.completion = 0;
                    }
                }
            } catch (err) {
                App.reporter.logError(err);
                return null;
            }
            return meta;
        },

        saveTargetTranslation: function (translation, meta, user) {
            var paths = this.getPaths(meta);
            var projectClass = meta.project_type_class;

            var sources = meta.source_translations.map(function (source) {
                    return {
                        language_id: source.language_id,
                        resource_id: source.resource_id,
                        checking_level: source.checking_level,
                        date_modified: source.date_modified,
                        version: source.version
                    };
                });

            var manifest = {
                package_version: meta.package_version,
                format: meta.format,
                generator: {
                    name: 'ts-desktop',
                    build: ''
                },
                target_language: meta.target_language,
                project: meta.project,
                type: meta.type,
                resource: meta.resource,
                source_translations: sources,
                parent_draft: meta.parent_draft,
                translators: meta.translators,
                finished_chunks: meta.finished_chunks
            };

            var writeFile = function (name, data) {
                return function () {
                    return write(name, toJSON(data));
                };
            };

            var makeChapterDir = function (chunk) {
                return mkdirp(path.join(paths.projectDir, chunk.chunkmeta.chapterid));
            };

            var makeChapterDirs = function (data) {
                return function () {
                    return Promise.all(_.map(data, makeChapterDir));
                };
            };

            var cleanChapterDir = function (data, chapter) {
                var chapterpath = path.join(paths.projectDir, chapter);
                return readdir(chapterpath).then(function (dir) {
                    return !dir.length ? rm(chapterpath): true;
                });
            };

            var cleanChapterDirs = function () {
                return function () {
                    var data = _.groupBy(translation, function (chunk) {
                        return chunk.chunkmeta.chapterid;
                    });
                    return Promise.all(_.map(data, cleanChapterDir));
                };
            };

            var updateChunk = function (chunk) {
                var file = path.join(paths.projectDir, chunk.chunkmeta.chapterid, chunk.chunkmeta.frameid + '.txt');
                var hasContent = false;
                if (projectClass === "standard") {
                    hasContent = !!chunk.transcontent;
                }
                if (projectClass === "helps") {
                    hasContent = !!chunk.helpscontent.length;
                }
                if (projectClass === "extant" && (!!chunk.helpscontent[0].title || !!chunk.helpscontent[0].body)) {
                    hasContent = true;
                }
                return hasContent ? write(file, projectClass === "standard" ? chunk.transcontent : toJSON(chunk.helpscontent)) : rm(file);
            };

            var updateChunks = function (data) {
                return function () {
                    return Promise.all(_.map(data, updateChunk));
                };
            };

            var setLicense = function () {
                return read(path.join(srcDir, 'assets', 'LICENSE.md'))
                    .then(function(data) {
                        return write(paths.license, data);
                    });
            };

            return mkdirp(paths.projectDir)
                .then(setLicense())
                .then(writeFile(paths.manifest, manifest))
                .then(makeChapterDirs(translation))
                .then(updateChunks(translation))
                .then(cleanChapterDirs())
                .then(function () {
                    return git.init(paths.projectDir);
                })
                .then(function () {
                    return git.stage(user, paths.projectDir);
                });
        },

        loadProjectsList: function () {
            return readdir(config.targetDir);
        },

        loadTargetTranslationsList: function () {
            var makePaths = config.makeProjectPathsForProject.bind(config);

            return this.loadProjectsList()
                .then(map(makePaths))
                .then(map('manifest'))
                .then(function (list) {
                    return _.filter(list, function (path) {
                        try {
                            var test = fs.statSync(path);
                        } catch (e) {
                            test = false;
                        }
                        return test;
                    })
                })
                .then(map(read))
                .then(Promise.all.bind(Promise))
                .then(map(fromJSON))
        },

        migrateTargetTranslationsList: function () {
            var makePaths = config.makeProjectPathsForProject.bind(config);

            return this.loadProjectsList()
                .then(map(makePaths))
                .then(migrator.migrateAll)
        },

        loadFinishedFramesList: function (meta) {
            var paths = config.makeProjectPaths(meta);

            return read(paths.manifest).then(function (manifest) {
                var finishedFrames = fromJSON(manifest).finished_chunks;
                return _.indexBy(finishedFrames);
            });
        },

        loadTargetTranslation: function (meta) {
            var paths = this.getPaths(meta);
            var isTranslation = this.isTranslation(meta);

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
