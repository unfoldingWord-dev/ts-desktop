'use strict';

var _ = require('lodash'),
    path = require('path'),
    AdmZip = require('adm-zip'),
    utils = require('lib/utils'),
    migrator = require('../js/migrator');

function ImportManager(configurator) {

    return {

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
                        return utils.makeProjectPaths(extractPath, targetPath);
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

                        return utils.fs.move(tmpPath, targetPath, {clobber: true});
                    });
                })
                .then(function (list) {
                    return Promise.all(list);
                })
                .then(function () {
                    return utils.fs.remove(tmpDir);
                });
        }
    };
}

module.exports.ImportManager = ImportManager;
