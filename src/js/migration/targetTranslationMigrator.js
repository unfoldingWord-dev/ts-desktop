'use strict';

;(function () {

    let _ = require('lodash'),
        path = require('path'),
        fs = require('fs'),
        utils = require('../../js/lib/util'),
        jsonfile = require('jsonfile');
    /**
     * Performs the nessesary migrations on a target translation.
     * Migrations should always pass through in order to collect all needed updates
     * without having to always update past migrations.
     * @param dir {string} the target translation directory
     * @returns {Promise.<boolean>} true if migration was successful
     */
    function migrate (dir) {
        return new Promise(function(resolve, reject) {
            try {
                let manifestFile = path.join(dir, 'manifest.json');
                jsonfile.readFile(manifestFile, function(readErr, manifest) {
                    if(readErr !== null) {
                        reject('failed to read the manifest ' + readErr);
                    } else {
                        let packageVersion = manifest.package_version;
                        switch (packageVersion) {
                            case 2:
                                manifest = v2(manifest);
                            case 3:
                                manifest = v3(manifest);
                            case 4:
                                manifest = v4(manifest, dir);
                            case 5:
                                manifest = v5(manifest);
                            case 6:
                                manifest = v6(manifest);
                                break;
                            default:
                                reject('unsupported package version "' + packageVersion + '"');
                        }

                        // update generator
                        manifest.generator.name = 'ts-desktop';
                        // TODO: update build number

                        // save manifest
                        jsonfile.writeFile(manifestFile, manifest, {spaces:2}, function (writeErr) {
                            if(writeErr !== null) {
                                reject('failed to update the manifest: ' + writeErr);
                            } else {
                                resolve(true);
                            }
                        });
                    }
                });
            } catch (err) {
                reject('failed to migrate target translation: ' + err);
            }
        });

    }

    /**
     * current version
     * @param manifest {JSON}
     * @retusn {JSON}
     */
    function v6(manifest) {
        return manifest;
    }

    function v5(manifest) {
        return manifest;
    }

    /**
     * major restructuring of the manifest to provide better support for future front/back matter, drafts, rendering,
     * and solves issues between desktop and android platforms.
     * @param manifest {JSON}
     * @param dir {string} the path to the target translation
     * @returns {JSON}
     */
    function v4(manifest, dir) {
        // translation type
        let typeId = _.get(manifest, 'project.type', 'text').toLowerCase();
        let typeNames = {
            text: 'Text',
            tn: 'Notes',
            tq: 'Questions',
            tw: 'Words',
            ta: 'Academy'
        };
        if(_.has(manifest, 'project.type')) {
            delete manifest.project.type;
        }
        manifest.type = {
            id: typeId,
            name: _.get(typeNames, typeId, '')
        };

        // update project
        // NOTE: this was actually in v3 but we missed it so we need to catch it here
        if(_.has(manifest, 'project_id')) {
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
        if(_.has(manifest, 'resource_id')) {
            let resourceId =_.get(manifest, 'resource_id', 'reg');
            delete manifest.resource_id;
            manifest.resource = {
                id: resourceId,
                name: _.get(resourceNames, resourceId, '')
            };
        } else if(!_.has(manifest, 'resource')) {
            // add missing resource
            if(_.get(manifest, 'type.id') === 'text') {
                let resourceId =_.get(manifest, 'project.id') === 'obs' ? 'obs' : 'reg';
                manifest.resource = {
                    id: resourceId,
                    name: _.get(resourceNames, resourceId, '')
                };
            }
        }

        // update source translations
        manifest.source_translations = _.values(_.mapValues(manifest.source_translations, function(value, key) {
            let parts = key.split('-');
            if(parts.length > 2) {
                let languageResourceId = key.substring(parts[0].length + 1, key.length);
                let pieces = languageResourceId.split('-');
                if(pieces.length > 0) {
                    let resourceId = pieces[pieces.length - 1];
                    value.resource_id = resourceId;
                    value.language_id = languageResourceId.substring(0, languageResourceId.length - resourceId.length - 1);
                }
            }
            return value;
        }));

        // update parent draft
        if(_.has(manifest, 'parent_draft_resource_id')) {
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
        _.forEach(_.get(manifest, 'finished_titles'), function(value, index) {
            let finishedChunks = _.get(manifest, 'finished_chunks', []);
            finishedChunks.push(value + '-title');
            manifest.finished_chunks = _.unique(finishedChunks);
        });
        delete manifest.finished_titles;

        // remove finished references
        _.forEach(_.get(manifest, 'finished_references'), function(value, index) {
            let finishedChunks = _.get(manifest, 'finished_chunks', []);
            finishedChunks.push(value + '-reference');
            manifest.finished_chunks = _.unique(finishedChunks);
        });
        delete manifest.finished_references;

        // remove project components
        _.forEach(_.get(manifest, 'finished_project_components'), function(value, index) {
            let finishedChunks = _.get(manifest, 'finished_chunks', []);
            finishedChunks.push('00-'+value);
            manifest.finished_chunks = _.unique(finishedChunks);
        });
        delete manifest.finished_project_components;

        // add format
        if(!_.has(manifest, 'format') || manifest.format === 'usx' || manifest.format === 'default') {
            manifest.format = _.get(manifest, 'type.id', 'text') !== 'text' || _.get(manifest, 'project.id') === 'obs' ? 'markdown' : 'usfm';
        }

        // update package version
        manifest.package_version = 5;

        // update where project title is saved
        let oldProjectTitlePath = path.join(dir, 'title.txt');
        let projectTranslationDir = path.join(dir, '00');
        let newProjectTitlePath = path.join(projectTranslationDir, 'title.txt');
        if(fs.existsSync(oldProjectTitlePath)) {
            try {
                fs.mkdirSync(projectTranslationDir);
            } catch (e) {
                console.log(e);
            }
            let projectTitle = fs.readFileSync(oldProjectTitlePath).toString();
            fs.writeFileSync(newProjectTitlePath, projectTitle);
            fs.unlink(oldProjectTitlePath);
        }

        return manifest;
    }

    /**
     * We changed how translator information is stored
     * we no longer store sensitive infromation like email an dphone number
     * we added a project_type
     * @param manifest {JSON}
     * @returns {JSON}
     */
    function v3(manifest) {
        // flatten translators to an array of names
        manifest.translators = _.unique(_.map(_.values(manifest.translators), function(obj) {
            return typeof obj === 'string' ? obj : obj.name;
        }));
        return manifest;
    }

    /**
     * updated structure of finished frames, chapter titles/references, project id, and target language id
     *
     * @param manifest {JSON}
     * @returns {JSON} the migrated manifest or null
     */
    function v2(manifest) {

        // finished frames
        manifest.finished_frames = [];
        _.forEach(manifest.frames, function(finished, frame) {
            if(finished) {
                manifest.finished_frames.push(frame);
            }
        });
        delete manifest.frames;

        // finished chapter titles/references
        manifest.finished_titles = [];
        manifest.finished_references = [];
        _.forEach(manifest.chapters, function(state, chapter) {
            if(state.finished_title) {
                manifest.finished_titles.push(chapter);
            }
            if(state.finished_reference) {
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
        if(!manifest.hasOwnProperty('translators')) {
            manifest.translators = [];
        }
        if(!manifest.hasOwnProperty('source_translations')) {
            manifest.source_translations = {};
        }

        return manifest;
    }

    exports.migrate = migrate;
}());
