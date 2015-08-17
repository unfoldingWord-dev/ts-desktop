'use strict';

;(function () {

    let Downloader = require('./downloader').Downloader;
    let Indexer = require('./indexer').Indexer;
    let async = require('async');

    function Navigator () {
        // used to maintain state while performing async operations
        let asyncState = {
            availableUpdates: {}
        };

        let config = {
            asyncLimit: App.configurator.getValue('asyncLimit')
        };

        // create indexes
        let indexConfig = {
            apiUrl: App.configurator.getValue('apiUrl'),
            indexDir: App.configurator.getValue('indexDir')
        };
        let downloadIndex = new Indexer('downloads', indexConfig);
        let appIndex = new Indexer('app', indexConfig);

        // create downloader
        let downloader = new Downloader({
            apiUrl: App.configurator.getValue('apiUrl')
        }, downloadIndex, appIndex);

        let downloadResourceList = function (projectId, sourceLanguageId, done) {
            let promise = downloader.downloadResourceList(projectId, sourceLanguageId);
            promise.then(function () {
                for (let resourceId of downloadIndex.getResources(projectId, sourceLanguageId)) {
                    let serverResourceModified = downloadIndex.getResourceMeta(projectId, sourceLanguageId, resourceId, 'date_modified');
                    let localResourceModified = appIndex.getResourceMeta(projectId, sourceLanguageId, resourceId, 'date_modified');
                    if (localResourceModified === null || parseInt(localResourceModified) < parseInt(serverResourceModified)) {
                        // build update list
                        if (typeof asyncState.availableUpdates[projectId] === 'undefined') {
                            asyncState.availableUpdates[projectId] = [];
                        }
                        if (typeof asyncState.availableUpdates[projectId][sourceLanguageId] === 'undefined') {
                            asyncState.availableUpdates[projectId][sourceLanguageId] = [];
                        }
                        asyncState.availableUpdates[projectId][sourceLanguageId].push(resourceId);
                    }
                }
                done();
            });
            promise.catch(function () {
                App.reporter.logWarning('Could not download the resource list for ' + projectId + ':' + sourceLanguageId);
                done();
            });
        };

        let downloadSourceLanguageList = function (projectId, done) {
            let promise = downloader.downloadSourceLanguageList(projectId);
            promise.then(function () {
                // queue resource downloads
                let queue = async.queue(function (task, callback) {
                    downloadResourceList(task.projectId, task.sourceLanguageId, callback);
                }, config.asyncLimit);
                queue.drain = function () {
                    done();
                };
                for (let sourceLanguageId of downloadIndex.getSourceLanguages(projectId)) {
                    let serverSourceLanguageModified = downloadIndex.getSourceLanguageMeta(projectId, sourceLanguageId, 'date_modified');
                    let localSourceLanguageModified = appIndex.getSourceLanguageMeta(projectId, sourceLanguageId, 'date_modified');
                    if (localSourceLanguageModified === null || parseInt(localSourceLanguageModified) < parseInt(serverSourceLanguageModified)) {
                        queue.push({
                            projectId: projectId,
                            sourceLanguageId: sourceLanguageId
                        });
                    }
                }
            });
            promise.catch(function () {
                App.reporter.logWarning('Could not download the source language list for ' + projectId);
                done();
            });
        };

        let navigator = {
            /**
             * Returns an index of the server library
             */
            getServerLibraryIndex: function () {
                return new Promise(function (resolve, reject) {
                    let promise = downloader.downloadProjectList();
                    promise.then(function () {
                        // queue source language downloads
                        let queue = async.queue(function (task, callback) {
                            downloadSourceLanguageList(task.projectId, callback);
                        }, config.asyncLimit);
                        queue.drain = function () {
                            resolve(downloadIndex, asyncState.availableUpdates);
                        };
                        for (let projectId of downloadIndex.getProjects()) {
                            let serverProjectModified = downloadIndex.getProjectMeta(projectId, 'date_modified');
                            let localProjectModified = appIndex.getProjectMeta(projectId, 'date_modified');
                            if (localProjectModified === null || parseInt(localProjectModified) < parseInt(serverProjectModified)) {
                                queue.push({projectId: projectId});
                            }
                        }
                    });
                    promise.catch(function () {
                        App.reporter.logWarning('Could not download project list');
                        reject();
                    });
                });
            },

            /**
             * Returns a list of data to populate the list of projects the user can choose from
             */
            getProjectListData: function (callback) {
                // TODO: load data and return to callback
                callback();
            },

            /**
             * Returns a list of data to populate the list of chapters the user can choose from
             * @param callback
             */
            getChapterListData: function (callback) {
                // TODO: load data and return to callback
                callback();
            },

            /**
             * Returns a list of data to populate the list of frames the user can choose from
             * @param callback
             */
            getFrameListData: function (callback) {
                // TODO: load data and return to callback
                callback();
            }
        };
        return navigator;
    }

    exports.Navigator = Navigator;
}());
