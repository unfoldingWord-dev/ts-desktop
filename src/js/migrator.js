'use strict';

var {chunkUSFM} = require('./importer');
var fs = require('fs-extra');
var mkdirp = require('mkdirp');
var {updateChunk, updateManifestToMeta} = require('./projects');

var _ = require('lodash'),
    AdmZip = require('adm-zip'),
    path = require('path'),
    utils = require('../js/lib/utils');

function MigrateManager(configurator, git, reporter, dataManager) {

    var write = utils.fs.outputFile,
        read = utils.fs.readFile,
        toJSON = _.partialRight(JSON.stringify, null, '\t'),
        fromJSON = JSON.parse.bind(JSON);

    return {

        migrateAll: function (list) {
            var getProjectName = function (proj) {
                return proj.projectDir.split(path.sep).pop();
            };

            return utils.chain(this.migrate, function(err, proj) {
                var name = getProjectName(proj);
                reporter.logWarning(err, 'Unable to migrate project ' + name);

                return false;
            })(list).then(function (migrated) {
                var names = migrated.map(function (manifest) {
                    return getProjectName(manifest.paths);
                });
                reporter.logNotice(names, 'Migrated projects');
                return migrated;
            });
        },

        migrate: function (paths) {
            var user = configurator.getValue("userdata");

            /**
             * Loads the manifest from the disk.
             * @param paths
             * @returns {Promise<any>} an object containing the manifest and project paths
             */
            var readManifest = function (paths) {
                return new Promise(function (resolve, reject) {
                    try {
                        var manifest = JSON.parse(fs.readFileSync(paths.manifest));
                        manifest.package_version = manifest.package_version || 2;
                        resolve({
                            manifest: manifest,
                            paths: paths
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            };

            var migrateV2 = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                if (manifest.package_version <= 2) {
                    // finished frames
                    manifest.finished_frames = [];
                    _.forEach(manifest.frames, function (finished, frame) {
                        if (finished) {
                            manifest.finished_frames.push(frame);
                        }
                    });
                    delete manifest.frames;

                    // finished chapter titles/references
                    manifest.finished_titles = [];
                    manifest.finished_references = [];
                    _.forEach(manifest.chapters, function (state, chapter) {
                        if (state.finished_title) {
                            manifest.finished_titles.push(chapter);
                        }
                        if (state.finished_reference) {
                            manifest.finished_references.push(chapter);
                        }
                    });
                    delete manifest.chapters;

                    // project id
                    manifest.project_id = manifest.slug;
                    delete manifest.slug;

                    // target language
                    manifest.target_language.id = manifest.target_language.slug;
                    delete manifest.target_language.slug;

                    // add placeholders
                    manifest.package_version = 3;
                    if (!manifest.hasOwnProperty('translators')) {
                        manifest.translators = [];
                    }
                    if (!manifest.hasOwnProperty('source_translations')) {
                        manifest.source_translations = {};
                    }
                }

                return {manifest: manifest, paths: paths};
            };

            var migrateV3 = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                if (manifest.package_version <= 3) {
                    // flatten translators to an array of names
                    manifest.translators = _.unique(_.map(_.values(manifest.translators), function (obj) {
                        return typeof obj === 'string' ? obj : obj.name;
                    }));
                }

                return {manifest: manifest, paths: paths};
            };

            var migrateV4 = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                if (manifest.package_version <= 4) {
                    let dir = project.paths.projectDir;
                    // translation type
                    let typeId = _.get(manifest, 'project.type', 'text').toLowerCase();
                    let typeNames = {
                        text: 'Text',
                        tn: 'Notes',
                        tq: 'Questions',
                        tw: 'Words',
                        ta: 'Academy'
                    };
                    if (_.has(manifest, 'project.type')) {
                        delete manifest.project.type;
                    }
                    manifest.type = {
                        id: typeId,
                        name: _.get(typeNames, typeId, '')
                    };

                    // update project
                    // NOTE: this was actually in v3 but we missed it so we need to catch it here
                    if (_.has(manifest, 'project_id')) {
                        manifest.project = {
                            id: manifest.project_id,
                            name: ""
                        };
                        delete manifest.project_id;
                    }

                    // update resource
                    let resourceNames = {
                        ulb: 'Unlocked Literal Bible',
                        udb: 'Unlocked Dynamic Bible',
                        obs: 'Open Bible Stories',
                        reg: 'Regular'
                    };
                    if (_.has(manifest, 'resource_id')) {
                        let resourceId = _.get(manifest, 'resource_id', 'reg');
                        delete manifest.resource_id;
                        manifest.resource = {
                            id: resourceId,
                            name: _.get(resourceNames, resourceId, '')
                        };
                    } else if (!_.has(manifest, 'resource')) {
                        // add missing resource
                        if (_.get(manifest, 'type.id') === 'text') {
                            let resourceId = _.get(manifest, 'project.id') === 'obs' ? 'obs' : 'reg';
                            manifest.resource = {
                                id: resourceId,
                                name: _.get(resourceNames, resourceId, '')
                            };
                        }
                    }

                    // update source translations
                    manifest.source_translations = _.values(_.mapValues(manifest.source_translations, function (value, key) {
                        let parts = key.split('-');
                        if (parts.length > 2) {
                            let languageResourceId = key.substring(parts[0].length + 1, key.length);
                            let pieces = languageResourceId.split('-');
                            if (pieces.length > 0) {
                                let resourceId = pieces[pieces.length - 1];
                                value.resource_id = resourceId;
                                value.language_id = languageResourceId.substring(0, languageResourceId.length - resourceId.length - 1);
                            }
                        }
                        return value;
                    }));

                    // update parent draft
                    if (_.has(manifest, 'parent_draft_resource_id')) {
                        manifest.parent_draft = {
                            resource_id: manifest.parent_draft_resource_id,
                            checking_entity: '',
                            checking_level: '',
                            comments: 'The parent draft is unknown',
                            contributors: '',
                            publish_date: '',
                            source_text: '',
                            source_text_version: '',
                            version: ''
                        };
                        delete manifest.parent_draft_resource_id;
                    }

                    // update finished chunks
                    manifest.finished_chunks = _.get(manifest, 'finished_frames', []);
                    delete manifest.finished_frames;

                    // remove finished titles
                    _.forEach(_.get(manifest, 'finished_titles'), function (value, index) {
                        let finishedChunks = _.get(manifest, 'finished_chunks', []);
                        finishedChunks.push(value + '-title');
                        manifest.finished_chunks = _.unique(finishedChunks);
                    });
                    delete manifest.finished_titles;

                    // remove finished references
                    _.forEach(_.get(manifest, 'finished_references'), function (value, index) {
                        let finishedChunks = _.get(manifest, 'finished_chunks', []);
                        finishedChunks.push(value + '-reference');
                        manifest.finished_chunks = _.unique(finishedChunks);
                    });
                    delete manifest.finished_references;

                    // remove project components
                    _.forEach(_.get(manifest, 'finished_project_components'), function (value, index) {
                        let finishedChunks = _.get(manifest, 'finished_chunks', []);
                        finishedChunks.push('00-' + value);
                        manifest.finished_chunks = _.unique(finishedChunks);
                    });
                    delete manifest.finished_project_components;

                    // add format
                    if (!_.has(manifest, 'format') || manifest.format === 'usx' || manifest.format === 'default') {
                        manifest.format = _.get(manifest, 'type.id', 'text') !== 'text' || _.get(manifest, 'project.id') === 'obs' ? 'markdown' : 'usfm';
                    }

                    // update package version
                    manifest.package_version = 5;

                    // update where project title is saved
                    let oldProjectTitlePath = path.join(dir, 'title.txt');
                    let projectTranslationDir = path.join(dir, '00');
                    let newProjectTitlePath = path.join(projectTranslationDir, 'title.txt');

                    return utils.fs.stat(oldProjectTitlePath)
                        .then(function () {
                            return utils.fs.mkdirs(projectTranslationDir);
                        })
                        .then(function () {
                            return utils.fs.readFile(oldProjectTitlePath);
                        })
                        .then(function (results) {
                            return utils.fs.outputFile(newProjectTitlePath, results.toString());
                        })
                        .then(function () {
                            return utils.fs.remove(oldProjectTitlePath);
                        })
                        .then(function () {
                            return {manifest: manifest, paths: paths};
                        })
                        .catch(function (err) {
                            return {manifest: manifest, paths: paths};
                        });
                }

                return {manifest: manifest, paths: paths};
            };

            var migrateV5 = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                if (manifest.package_version <= 5) {
                    let oldname = paths.projectDir.substring(paths.projectDir.lastIndexOf(path.sep) + 1);
                    if (manifest.project.id === "tw") {
                        manifest.project.id = "bible";
                        manifest.project.name = "translationWords";
                    }
                    if (manifest.project.id === "ta") {
                        manifest.project.id = "vol1";
                        manifest.project.name = "translationAcademy Vol 1";
                    }
                    let unique_id = manifest.target_language.id + "_" + manifest.project.id + "_" + manifest.type.id;
                    if (manifest.resource.id !== "") {
                        unique_id += "_" + manifest.resource.id;
                    }
                    let oldpath = path.join(paths.parentDir, oldname);
                    let newpath = path.join(paths.parentDir, unique_id);
                    let localstorageitems = ["-chapter", "-index", "-selected", "-completion", "-source"];
                    let backupDir = configurator.getUserPath('datalocation', 'automatic_backups');
                    let oldbackup = path.join(backupDir, oldname);
                    let readyfile = path.join(paths.projectDir, 'READY');
                    let srcDir = path.resolve(path.join(__dirname, '..'));

                    for (var i = 0; i < localstorageitems.length; i++) {
                        configurator.setValue(unique_id + localstorageitems[i], configurator.getValue(oldname + localstorageitems[i]));
                        configurator.unsetValue(oldname + localstorageitems[i]);
                    }

                    paths.projectDir = newpath;
                    paths.manifest = path.join(newpath, 'manifest.json');
                    paths.license = path.join(newpath, 'LICENSE.md');

                    // update package version
                    manifest.package_version = 6;

                    return utils.fs.readFile(path.join(srcDir, 'assets', 'LICENSE.md'))
                        .then(function (license) {
                            return Promise.all([
                                utils.fs.outputFile(paths.license, license),
                                utils.fs.remove(readyfile),
                                utils.fs.remove(oldbackup),
                                utils.fs.mkdirs(newpath)
                            ]);
                        })
                        .then(function () {
                            return utils.fs.mover(oldpath, newpath);
                        })
                        .then(function () {
                            return {manifest: manifest, paths: paths};
                        });
                }

                return {manifest: manifest, paths: paths};
            };

            var migrateV6 = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;
                if (manifest.package_version <= 6) {
                    var targetPath;
                    var lastChapter = "00";
                    var lastChunk = "01";
                    var titleexists = false;

                    return utils.fs.readdir(paths.projectDir)
                        .then(function (all) {
                            all.forEach(function (item) {
                                if (item === "00") {
                                    titleexists = true;
                                }
                                if (parseInt(item) && parseInt(item) > parseInt(lastChapter)) {
                                    lastChapter = item;
                                }
                            });
                            targetPath = path.join(paths.projectDir, lastChapter, "00.txt");

                            return utils.fs.stat(targetPath).then(utils.ret(true)).catch(utils.ret(false));
                        })
                        .then(function (exists) {
                            if (exists) {
                                var resourceDir = dataManager.getResourceDir();
                                var container = "en_" + manifest.project.id + "_ulb";

                                return dataManager.activateContainer("en", manifest.project.id, "ulb")
                                    .then(function () {
                                        return utils.fs.readdir(path.join(resourceDir, container, "content", lastChapter));
                                    })
                                    .then(function (files) {
                                        files.forEach(function (file) {
                                            var item = file.split(".")[0];
                                            if (parseInt(item) && parseInt(item) > parseInt(lastChunk)) {
                                                lastChunk = item;
                                            }
                                        });

                                        return utils.fs.copy(targetPath, path.join(paths.projectDir, lastChapter, lastChunk + ".txt"), {clobber: true});
                                    })
                                    .then(function () {
                                        return utils.fs.remove(targetPath);
                                    })
                                    .then(function () {
                                        if (manifest.finished_chunks && manifest.finished_chunks.length) {
                                            var oldid = lastChapter + "-00";
                                            var newid = lastChapter + "-" + lastChunk;
                                            var index = manifest.finished_chunks.indexOf(oldid);

                                            if (index > -1) {
                                                manifest.finished_chunks.splice(index, 1);
                                                manifest.finished_chunks.push(newid);
                                            }
                                        }
                                    });
                            }
                        })
                        .then(function () {
                            if (titleexists) {
                                var oldPath = path.join(paths.projectDir, "00");
                                var newPath = path.join(paths.projectDir, "front");

                                return utils.fs.copy(oldPath, newPath, {clobber: true})
                                    .then(function () {
                                        return utils.fs.remove(oldPath);
                                    })
                                    .then(function () {
                                        if (manifest.finished_chunks && manifest.finished_chunks.length) {
                                            var oldid = "00-title";
                                            var newid = "front-title";
                                            var index = manifest.finished_chunks.indexOf(oldid);

                                            if (index > -1) {
                                                manifest.finished_chunks.splice(index, 1);
                                                manifest.finished_chunks.unshift(newid);
                                            }
                                        }
                                    });
                            }
                        })
                        .then(function () {
                            manifest.package_version = 7;

                            return {manifest: manifest, paths: paths};
                        });
                }

                return {manifest: manifest, paths: paths};
            };

            var migrateV7 = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                if (manifest.package_version <= 7) {
                    //add code here to migrate to v8
                }

                return {manifest: manifest, paths: paths};
            };

            /**
             * Performs the migration from tC to tS.
             * This should always migrate to the latest.
             * @param project
             * @returns {*}
             */
            var migrateTranslationCore = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                if(manifest.generator.name === 'tc-desktop' || manifest.tcInitialized) {
                    // update manifest
                    manifest.finished_chunks = manifest.finished_chunks || [];
                    manifest.parent_draft = manifest.parent_draft || {};
                    manifest.package_version = 7;
                    manifest.format = 'usfm';
                    if(!manifest.project) {
                        manifest.project = {};
                    }
                    // reconstruct project id
                    if (!manifest.project.id && manifest.ts_project.id) {
                        manifest.project.id = manifest.ts_project.id;
                    }
                    // reconstruct the project name
                    if (!manifest.project.name &&
                        manifest.ts_project &&
                        manifest.ts_project.name) {
                        manifest.project.name = manifest.ts_project.name;
                    } else if(!manifest.project.name &&
                        manifest.target_language.book &&
                        manifest.target_language.book.name) {
                        manifest.project.name = manifest.target_language.book.name;
                    }
                    manifest.resource.id = manifest.resource.id.toLowerCase();
                    if(!manifest.type || !manifest.type.id || !manifest.type.name) {
                        manifest.type = {
                            id: 'text',
                            name: 'Text'
                        };
                    }

                    // clear out everything else from the manifest
                    const newManifest = {
                        generator: manifest.generator, // this will be overwritten later on
                        package_version: manifest.package_version,
                        project: {
                            id: manifest.project.id,
                            name: manifest.project.name,
                        },
                        type: manifest.type,
                        resource: manifest.resource,
                        format: manifest.format,
                        target_language: {
                            id: manifest.target_language.id,
                            name: manifest.target_language.name,
                            direction: manifest.target_language.direction
                        },
                        translators: manifest.translators,
                        source_translations: manifest.source_translations,
                        finished_chunks: manifest.finished_chunks,
                        parent_draft: manifest.parent_draft
                    };

                    // TRICKY: this is a hack. see below
                    const writableManifest = Object.assign({}, newManifest);

                    // TRICKY: start by completely overwriting the manifest
                    // because the normal manifest update keeps stuff
                    // but we don't want to keep any tc stuff
                    return write(paths.manifest, newManifest).then(function() {
                        // rename project folder (so writing usfm works)
                        return migrateName({
                            manifest: newManifest,
                            paths
                        });
                    }).then(function(movedProject) {
                        // TRICKY: update the paths after having moved the project
                        paths = movedProject.paths;
                        // import usfm file.
                        let unique_id = [
                            newManifest.target_language.id,
                            newManifest.resource.id,
                            newManifest.project.id,
                            'book'
                        ].join('_');
                        let usfmPath = path.join(paths.projectDir,
                            unique_id + ".usfm");
                        if (!fs.existsSync(usfmPath)) {
                            usfmPath = path.join(paths.projectDir,
                                newManifest.project.id + ".usfm");
                        }

                        if (fs.existsSync(usfmPath)) {
                            let meta = updateManifestToMeta(newManifest,
                                dataManager, reporter);
                            return chunkUSFM(usfmPath, newManifest, dataManager).
                                then(function(chunks) {
                                    // write chunks
                                    let writes = [];
                                    chunks.map(function(chunk) {
                                        mkdirp.sync(path.join(paths.projectDir,
                                            chunk.chunkmeta.chapterid));
                                        writes.push(
                                            updateChunk(paths.parentDir, meta,
                                                chunk));
                                    });
                                    return Promise.all(writes);
                                });
                        }
                    }).then(function() {
                        // remove all the left over files from tC
                        const appsPath = path.join(paths.projectDir, '.apps');
                        const gitPath = path.join(paths.projectDir, '.git');
                        const bookFolder = path.join(paths.projectDir, newManifest.project.id);

                        return utils.fs.readdir(paths.projectDir).then(function(files) {
                            // remove all the extra usfm files that tc creates
                            const removes = [];
                            files.forEach(file => {
                                if(path.extname(file).toLowerCase() === '.usfm') {
                                    removes.push(utils.fs.remove(path.join(paths.projectDir, file)));
                                }
                            });
                            return Promise.all(removes);
                        }).then(function() {
                            return utils.fs.remove(appsPath);
                        }).then(function(){}).then(function() {
                            return utils.fs.remove(gitPath);
                        }).then(function() {
                            return utils.fs.remove(bookFolder);
                        }).then(function() {
                            return git.init(paths.projectDir);
                        });
                    }).then(function() {
                        // TRICKY: this is a crazy hack because something seems to be
                        // manipulating the manifest variable when it shouldn't be
                        return {manifest: writableManifest, paths: paths};
                    });
                } else {
                    return project;
                }
            };

            var migrateV8 = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                // TODO: migrate to 9.

                return {manifest: manifest, paths: paths};
            };

            var migrateName = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                let oldname = paths.projectDir.substring(paths.projectDir.lastIndexOf(path.sep) + 1);
                let unique_id = manifest.target_language.id + "_" + manifest.project.id + "_" + manifest.type.id;
                if (manifest.resource.id !== "") {
                    unique_id += "_" + manifest.resource.id;
                }

                if (oldname !== unique_id) {
                    let oldpath = path.join(paths.parentDir, oldname);
                    let newpath = path.join(paths.parentDir, unique_id);

                    paths.projectDir = newpath;
                    paths.manifest = path.join(newpath, 'manifest.json');
                    paths.license = path.join(newpath, 'LICENSE.md');

                    return utils.fs.mkdirs(newpath)
                        .then(function () {
                            return utils.fs.mover(oldpath, newpath);
                        })
                        .then(function () {
                            return {manifest: manifest, paths: paths};
                        });
                }

                return {manifest: manifest, paths: paths};
            };

            var checkVersion = function (project) {
                if (project.manifest.package_version !== 7) {
                    throw new Error("Failed to migrate project");
                }
                return project;
            };

            var saveManifest = function (project) {
                let manifest = project.manifest;
                let paths = project.paths;

                manifest.generator.name = 'ts-desktop';
                manifest.generator.build = configurator.getAppData().build;

                return write(paths.manifest, toJSON(manifest)).then(utils.ret({
                    manifest: manifest,
                    paths: paths
                }));
            };

            return readManifest(paths)
                .then(function(project) {
                    if(project.manifest.type.id === 'tn' || project.manifest.type.id === 'tq') {
                        // skip tn and tq projects
                        return Promise.resolve();
                    } else {
                        return Promise.resolve(project)
                        .then(migrateTranslationCore)
                        .then(migrateV2)
                        .then(migrateV3)
                        .then(migrateV4)
                        .then(migrateV5)
                        .then(migrateV6)
                        .then(migrateV7)
                        .then(migrateV8)
                        .then(migrateName)
                        .then(checkVersion)
                        .then(saveManifest)
                        .then(function (project) {
                            return git.commitAll(user, project.paths.projectDir).then(utils.ret(project));
                        })
                    }
                })
        },

        /**
         * This is used for listing backup target translations.
         * Right now backups are always exported to v2
         * @param file
         * @returns {Promise<any>}
         */
        listTargetTranslations: function (file) {

            /**
             * current version
             * @param manifest {JSON}
             * @returns {JSON} the migrated manifest or null
             */
            function v2(manifest) {
                manifest.package_version = 2;
                return manifest;
            }

            /**
             * target translation paths were stored in 'projects'
             * @param manifest {JSON}
             * @returns {JSON} the migrated manifest or null
             */
            function v1(manifest) {
                manifest.target_translations = manifest.projects;
                delete manifest['projects'];
                return manifest;
            }

            return new Promise(function (resolve, reject) {
                try {
                    let zip = new AdmZip(file);
                    let manifest = JSON.parse(zip.readAsText('manifest.json'));
                    let packageVersion = manifest.package_version;
                    switch (packageVersion) {
                        case 1:
                            manifest = v1(manifest);
                        case 2:
                            manifest = v2(manifest);
                            break;
                        default:
                            reject('unsupported package version "' + packageVersion + '"');
                    }

                    let paths = [];
                    _.forEach(manifest.target_translations, function (item) {
                        paths.push(item.path);
                    });

                    if (!paths.length) {
                        reject('The archive is empty or not supported');
                    } else {
                        resolve(paths);
                    }
                } catch (err) {
                    reject('failed to migrate tstudio archive: ' + err);
                }
            });
        }
    };
}

module.exports.MigrateManager = MigrateManager;
