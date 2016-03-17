'use strict';

;(function () {

    let AdmZip = require('adm-zip'),
        _ = require('lodash');
    /**
     * Returns a list of target translations in the archive
     *
     * This will perform the nessesary migrations on a tstudio archive.
     * Migrations should always pass through in order to collect all needed updates
     * without having to always update past migrations.
     * @param file {File} the tstudio archive file
     * @returns {Promise.<string[]>} an array of paths in the archive to target translations
     */
    function listTargetTranslations (file) {
        return new Promise(function(resolve, reject) {
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
                _.forEach(manifest.target_translations, function(item) {
                    paths.push(item.path);
                });
                resolve(paths);
            } catch (err) {
                reject('failed to migrate tstudio archive: ' + err);
            }
        });

    }

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

    exports.listTargetTranslations = listTargetTranslations;
}());
