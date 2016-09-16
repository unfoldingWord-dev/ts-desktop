'use strict';

var _ = require('lodash');
var request = require('request');
var utils = require('../js/lib/utils');
var fs = require('fs-extra');
var path = require('path');
var yaml = require('js-yaml');

function DataManager(db, resourceDir, apiURL) {

    return {

        updateLibrary: function () {
            return db.updatePrimaryIndex(apiURL)
                .then(function () {
                    var catalogs = db.indexSync.getCatalogs();

                    return utils.chain(function (item) {
                        return db.updateCatalogIndex(item.slug);
                    }, function (err, item) {
                        console.log("Cannot find catalog: " + item.slug);
                        return false;
                    })(catalogs);
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

        openContainer: function (language, project, resource) {
            return db.openResourceContainer(language, project, resource);
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
            return db.indexSync.getChunkMarkers(id, 'en-US');
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
            var container = source.language_id + "_" + source.project_id + "_" + source.resource_id;
            var frames = this.extractContainer(container);
            var toc = this.parseYaml(container, "toc.yml");
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
            var container = source.language_id + "_" + source.project_id + "_udb";
            if (source.resource_id === "ulb") {
                var frames = this.extractContainer(container);

                return frames.map(function (item) {
                    return {chapter: item.dir, verse: item.filename, chunk: item.content};
                });
            } else {
                return [];
            }
        },

        getSourceHelps: function (source, type) {
            var mythis = this;
            var container = source.language_id + "_" + source.project_id + "_" + type;
            var frames = this.extractContainer(container);

            return frames.map(function (item) {
                return {chapter: item.dir, verse: item.filename, data: mythis.parseHelps(item.content)};
            });
        },

        getSourceWords: function (source) {
            var container = source.language_id + "_" + source.project_id + "_" + source.resource_id;

            return this.parseYaml(container, "config.yml").content;
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
            var file = fs.readFileSync(filepath, "utf8");
            var parsed = yaml.load(file);

            if (filename === "toc.yml" && parsed[0].chapter === "front") {
                parsed[0].chapter = "00";
            }

            return parsed;
        },

        getRelatedWords: function (source, slug) {
            var mythis = this;
            var dict = "bible";
            if (source.resource_id === "obs") {
                dict = "bible-obs";
            }
            var container = "en_" + dict + "_tw";
            var list = this.parseYaml(container, "config.yml");

            if (list[slug] && list[slug]["see_also"]) {
                var slugs = list[slug]["see_also"];

                return slugs.map(function (item) {
                    return mythis.getWord(dict, item);
                });
            } else {
                return [];
            }
        },

        getWord: function (dict, slug) {
            var container = 'en_' + dict + '_tw';
            var contentpath = path.join(resourceDir, container, "content", slug, "01.md");

            try {
                var data = this.parseHelps(fs.readFileSync(contentpath, 'utf8'))[0];
                data.slug = slug;
                return data;
            } catch (err) {
                return null;
            }
        },

        getAllWords: function (dict) {
            var mythis = this;
            var container = "en_" + dict + "_tw";
            var frames = this.extractContainer(container);

            return frames.map(function (item) {
                var data = mythis.parseHelps(item.content)[0];
                data.slug = item.dir;
                return data;
            });
        },

        getWordExamples: function (source, slug) {
            var dict = "bible";
            if (source.resource_id === "obs") {
                dict = "bible-obs";
            }
            var container = "en_" + dict + "_tw";
            var list = this.parseYaml(container, "config.yml");

            if (list[slug] && list[slug]["examples"]) {
                var references = list[slug]["examples"];

                return references.map(function (item) {
                    var split = item.split("-");
                    return {chapter: parseInt(split[0]), frame: parseInt(split[1])};
                });
            } else {
                return [];
            }
        },

        getTa: function (volume) {

        }
    };
}

module.exports.DataManager = DataManager;
