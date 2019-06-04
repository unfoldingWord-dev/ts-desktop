'use strict';

var _ = require('lodash');
var request = require('request');
var utils = require('../js/lib/utils');
var fs = require('fs-extra');
var path = require('path');
var yaml = require('js-yaml');
var mkdirp = require('mkdirp');

function DataManager(db, resourceDir, apiURL, sourceDir) {

    return {

        getResourceDir: function () {
            return resourceDir;
        },

        updateLanguages: function (onProgress) {
            return db.updateCatalogs(onProgress);
        },

        updateSources: function (onProgress) {
            return db.updateSources(apiURL, onProgress);
        },

        updateChunks: function () {
            return db.updateChunks();
        },

        importContainer: function (filePath) {
            return db.importResourceContainer(filePath);
        },

        checkForContainer: function (filePath) {
            var mythis = this;

            return db.loadResourceContainer(filePath)
                .then(function (container) {
                    return mythis.containerExists(container.slug);
                })
                .catch(function (e) {
                    return false;
                });
        },

        containerExists: function (container) {
            var resourcePath = path.join(resourceDir, container);
            var sourcePath = path.join(sourceDir, container + ".tsrc");

            return utils.fs.stat(resourcePath).then(utils.ret(true)).catch(utils.ret(false))
                .then(function (resexists) {
                    return utils.fs.stat(sourcePath).then(utils.ret(true)).catch(utils.ret(false))
                        .then(function (srcexists) {
                            return resexists || srcexists;
                        });
                });
        },

        getMetrics: function () {
            return db.indexSync.getMetrics();
        },

        getSourceLanguages: function () {
            return db.indexSync.getSourceLanguages();
        },

        getTranslations: function () {
            return db.indexSync.findTranslations();
        },

        getTargetLanguages: function () {
            try {
                var list = db.indexSync.getTargetLanguages();
            } catch (e) {
                return [];
            }

            return list.map(function (item) {
                return {id: item.slug, name: item.name, direction: item.direction};
            });
        },

        getProjects: function (lang) {
            return db.indexSync.getProjects(lang || 'en');
        },

        getSourcesByProject: function (project) {
            var mythis = this;

            try {
                var allres = db.indexSync.getResources(null, project);
            } catch (e) {
                return Promise.resolve(true)
                    .then(function () {
                        return [];
                    });
            }

            var filterres = allres.filter(function (item) {
                return item.type === 'book' && (item.status.checking_level === "3" || item.imported);
            });

            var mapped = filterres.map(function (res) {
                return mythis.getSourceDetails(res.project_slug, res.source_language_slug, res.slug);
            });

            return utils.chain(this.validateExistence.bind(this))(mapped);
        },

        validateExistence: function (source) {
            var mythis = this;
            var container = source.language_id + "_" + source.project_id + "_" + source.resource_id;

            return mythis.containerExists(container)
                .then(function (exists) {
                    source.updating = false;
                    source.exists = exists;
                    return source;
                });
        },

        validateCurrent: function (source) {
            var mythis = this;
            var lang = source.language_id;
            var proj = source.project_id;
            var res = source.resource_id;
            var container = lang + "_" + proj + "_" + res;
            var manifest = path.join(resourceDir, container, "package.json");

            return mythis.activateProjectContainers(lang, proj, res)
                .then(function () {
                    return utils.fs.readFile(manifest)
                        .then(function (contents) {
                            var json = JSON.parse(contents);
                            source.current = json.resource.status.pub_date === source.date_modified;
                            return source;
                        });
                });
        },

        downloadContainer: function (language, project, resource) {
            return db.downloadResourceContainer(language, project, resource)
                .catch(function (err) {
                    throw err;
                });
        },

        downloadProjectContainers: function (item) {
            var mythis = this;
            var language = item.language_id || item.language.slug;
            var project = item.project_id || item.project.slug;
            var resource = item.resource_id || item.resource.slug;

            return mythis.downloadContainer(language, project, resource)
                .then(function () {
                    item.success = true;
                    return Promise.resolve(true);
                })
                .catch(function (err) {
                    var errmessage = 'Unknown Error while downloading';
                    if (err.syscall === "getaddrinfo") {
                        errmessage = "Unable to connect to server";
                    }
                    if (err.syscall === "read") {
                        errmessage = "Lost connection to server";
                    }
                    if (err.status === 404) {
                        errmessage = "Source not found on server";
                    }
                    item.failure = true;
                    item.errmsg = errmessage;
                })
                .then(function () {
                    return mythis.downloadContainer(language, project, "tn")
                        .catch(function () {
                            return true;
                        });
                })
                .then(function () {
                    return mythis.downloadContainer(language, project, "tq")
                        .catch(function () {
                            return true;
                        });
                })
                .then(function () {
                    if (resource === "ulb") {
                        return mythis.downloadContainer(language, project, "udb")
                            .catch(function () {
                                return true;
                            });
                    } else {
                        return Promise.resolve(true);
                    }
                })
                .then(function () {
                    return item;
                });
        },

        activateContainer: function (language, project, resource) {
            var container = language + "_" + project + "_" + resource;
            var resourcePath = path.join(resourceDir, container);
            var tempPath = path.join(resourceDir, container + ".tsrc");
            var sourcePath = path.join(sourceDir, container + ".tsrc");

            return utils.fs.stat(resourcePath).then(utils.ret(true)).catch(utils.ret(false))
                .then(function (resexists) {
                    if (!resexists) {
                        return utils.fs.stat(sourcePath).then(utils.ret(true)).catch(utils.ret(false))
                            .then(function (srcexists) {
                                if (srcexists) {
                                    return utils.fs.copy(sourcePath, tempPath, {clobber: true})
                                        .then(function () {
                                            return db.openResourceContainer(language, project, resource);
                                        })
                                        .then(function () {
                                            return utils.fs.remove(tempPath);
                                        })
                                        .then(function () {
                                            return Promise.resolve(true);
                                        });
                                }
                                return Promise.resolve("Resource container " + container + " does not exist");
                            });
                    }
                    return Promise.resolve(true);
                });
        },

        activateProjectContainers: function (language, project, resource) {
            var mythis = this;

            return mythis.activateContainer(language, project, resource)
                .then(function (msg) {
                    if (typeof msg === 'string') {
                        console.log(msg);
                    }
                })
                .then(function () {
                    return mythis.activateContainer(language, project, "tn");
                })
                .then(function () {
                    return mythis.activateContainer(language, project, "tq");
                })
                .then(function () {
                    if (resource === "ulb") {
                        return mythis.activateContainer(language, project, "udb");
                    } else {
                        return Promise.resolve(true);
                    }
                });
        },

        extractContainer: function (container) {
            var contentpath = path.join(resourceDir, container, "content");
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

                        data.push({chapter: dir, chunk: filename, content: content});
                    });
                });

                return data;
            } catch (err) {
                return data;
            }
        },

        getContainerData: function (container) {
            var frames = this.extractContainer(container);
            var toc = this.parseYaml(container, "toc.yml");
            var sorted = [];

            if (toc && typeof toc === "object") {
                toc.forEach (function (chapter) {
                    if (chapter.chunks) {
                        chapter.chunks.forEach (function (chunk) {
                            var results = frames.filter(function (item) {
                                return item.chapter === chapter.chapter && item.chunk === chunk;
                            });

                            if (results.length) {
                                sorted.push(results[0]);
                            } else {
                                console.log("Cannot find data for:", container, chapter, chunk);
                            }
                        });
                    }
                });

                return sorted;
            } else {
                return frames;
            }
        },

        getProjectName: function (id) {
            try {
                var project = db.indexSync.getProject('en', id);
            } catch (e) {
                return "";
            }

            if (project) {
                return project.name;
            } else {
                return "";
            }
        },

		getChunkMarkers: function (id) {
            return db.indexSync.getChunkMarkers(id, 'en-US');
		},

        getSourceDetails: function (project_id, language_id, resource_id) {
            try {
                var res = db.indexSync.getResource(language_id, project_id, resource_id);
                var lang = db.indexSync.getSourceLanguage(language_id);
                var id = language_id + "_" + project_id + "_" + resource_id;
            } catch (e) {
                return null;
            }

            if (!res || !lang) {
                return null;
            }

            return {
                unique_id: id,
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

        getSourceUdb: function (source) {
            var container = source.language_id + "_" + source.project_id + "_udb";

            // if (source.resource_id === "ulb") {
                return this.extractContainer(container);
            // } else {
            //     return [];
            // }
        },

        getSourceNotes: function (source) {
            var mythis = this;
            var container = source.language_id + "_" + source.project_id + "_tn";
            var frames = this.extractContainer(container);

            frames.forEach(function (item) {
                if (item.content) {
                    item.content = mythis.parseHelps(item.content);
                }
            });

            return frames;
        },

        getSourceQuestions: function (source) {
            var mythis = this;
            var container = source.language_id + "_" + source.project_id + "_tq";
            var frames = this.extractContainer(container);

            frames.forEach(function (item) {
                if (item.content) {
                    item.content = mythis.parseHelps(item.content);
                }
            });

            return frames;
        },

        getSourceWords: function (source) {
            var container = source.language_id + "_" + source.project_id + "_" + source.resource_id;
            var words = this.parseYaml(container, "config.yml");

            if (words && words.content) {
                return words.content;
            } else {
                return [];
            }
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

        parseYaml: function (container, filename) {
            var filepath = path.join(resourceDir, container, "content", filename);

            try {
                var file = fs.readFileSync(filepath, "utf8");
                return yaml.load(file);
            } catch (e) {
                console.log("Cannot read file:", filepath);
                return null;
            }
        },

        getRelatedWords: function (source, slug) {
            var mythis = this;
            var dict = "bible";
            if (source.resource_id === "obs") {
                dict = "bible-obs";
            }
            var container = source.language_id + "_" + dict + "_tw";
            var list = this.parseYaml(container, "config.yml");

            // fallback to english
            if(!list && source.language_id !== 'en') {
                container = "en_" + dict + "_tw";
                list = this.parseYaml(container, "config.yml");
            }

            if (list && list[slug] && list[slug]["see_also"]) {
                var slugs = list[slug]["see_also"];

                return slugs.map(function (item) {
                    var word = mythis.getWord(source.language_id, dict, item);
                    // fallback to english
                    if(!word) {
                        word = mythis.getWord('en', dict, item);
                    }
                    return word;
                });
            } else {
                return [];
            }
        },

        getWord: function (lang, dict, slug) {
            var container = lang + '_' + dict + '_tw';
            var contentpath = path.join(resourceDir, container, "content", slug, "01.md");

            try {
                var data = this.parseHelps(fs.readFileSync(contentpath, 'utf8'))[0];
                data.slug = slug;
                return data;
            } catch (err) {
                return null;
            }
        },

        getAllWords: function (lang, dict) {
            var mythis = this;
            var container = lang + "_" + dict + "_tw";
            var frames = this.extractContainer(container);

            // fallback to english
            if(!frames || frames.length === 0) {
                container = "en_" + dict + "_tw";
                frames = this.extractContainer(container);
            }

            return frames.map(function (item) {
                var data = mythis.parseHelps(item.content)[0];
                data.slug = item.chapter;
                return data;
            });
        },

        getWordExamples: function (source, slug) {
            var dict = "bible";
            if (source.resource_id === "obs") {
                dict = "bible-obs";
            }
            var container = source.language_id + "_" + dict + "_tw";
            var list = this.parseYaml(container, "config.yml");

            // fallback to english
            if(!list) {
                container = "en_" + dict + "_tw";
                list = this.parseYaml(container, "config.yml");
            }

            if (list && list[slug] && list[slug]["examples"]) {
                var references = list[slug]["examples"];

                return references.map(function (item) {
                    var split = item.split("-");
                    return {chapter: parseInt(split[0]), frame: parseInt(split[1])};
                });
            } else {
                return [];
            }
        },

        getAllTa: function () {
            var mythis = this;
            var containers = [
                "en_ta-intro_vol1",
                "en_ta-process_vol1",
                "en_ta-translate_vol1",
                "en_ta-translate_vol2",
                "en_ta-checking_vol1",
                "en_ta-checking_vol2",
                "en_ta-audio_vol2",
                "en_ta-gateway_vol3"
            ];
            var allchunks = [];

            containers.forEach(function (container) {
                allchunks.push(mythis.getContainerData(container));
            });

            allchunks = _.flatten(allchunks);

            allchunks.forEach(function (item) {
                if (item.chunk === "title") {
                    item.content = "# " + item.content;
                }
                if (item.chunk === "sub-title") {
                    item.content = "## " + item.content;
                }
            });

            return allchunks;
        }
    };
}

module.exports.DataManager = DataManager;
