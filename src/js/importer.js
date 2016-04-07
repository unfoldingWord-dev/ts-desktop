'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    AdmZip = require('adm-zip'),
    archiver = require('archiver'),
    utils = require('lib/utils'),
    migrator = require('../js/migrator'),
    wrap = utils.promisify,
    guard = utils.guard;

var map = guard('map'),
    indexBy = guard('indexBy'),
    flatten = guard('flatten'),
    compact = guard('compact');

function ImportManager(configurator) {

    var rm = wrap(null, rimraf);

    return {

        /**
         * Imports a tstudio archive
         * @param filePath {String} the path to the archive
         * @returns {Promise}
         */
        restoreTargetTranslation: function(filePath) {
            let zip = new AdmZip(filePath),
                tmpDir = configurator.getValue('tempDir'),
                targetDir = configurator.getValue('targetTranslationsDir'),
                basename = path.basename(filePath, '.tstudio'),
                extractPath = path.join(tmpDir, basename);

            return migrator.listTargetTranslations(filePath)
                .then(function(targetPaths) {
                    // NOTE: this will eventually be async
                    zip.extractAllTo(extractPath, true);
                    return targetPaths;
                })
                .then(function (targetPaths) {
                    return _.map(targetPaths, function (targetPath) {
                        var parentDir = extractPath;
                        var projectDir = path.join(extractPath, targetPath);
                        var manifest = path.join(projectDir, 'manifest.json');
                        var license = path.join(projectDir, 'LICENSE.md');
                        return {parentDir, projectDir, manifest, license};
                    });
                })
                .then(migrator.migrateAll)
                .then(function (results) {
                    if (!results.length) {
                        throw new Error ("Could not restore this project");
                    }
                    return results;
                })
                .then(function (results) {
                    return _.map(results, function (result) {
                        return result.paths.projectDir.substring(result.paths.projectDir.lastIndexOf(path.sep) + 1);
                    });
                })
                .then(function (targetPaths) {
                    return _.map(targetPaths, function(p) {
                        let tmpPath = path.join(extractPath, p),
                            targetPath = path.join(targetDir, p);

                        return utils.move(tmpPath, targetPath, {clobber: true});
                    });
                })
                .then(function (list) {
                    return Promise.all(list);
                })
                .then(function () {
                    return rm(tmpDir);
                });
        }

    };
}

module.exports.ImportManager = ImportManager;
