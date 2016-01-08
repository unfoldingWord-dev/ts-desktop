'use strict';

;(function () {

    let _ = require('lodash'),
        path = require('path'),
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
                                break;
                            default:
                                reject('unsupported package version "' + packageVersion + '"');
                        }
                        // save manifest
                        jsonfile.writeFile(manifestFile, manifest, function (writeErr) {
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
     * @returns {JSON}
     */
    function v3(manifest) {
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
        return manifest;
    }

    exports.migrate = migrate;
}());
