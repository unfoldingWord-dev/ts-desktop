
var Downloader = require('./downloader').Downloader;
var Indexer = require('./indexer').Indexer;

;(function () {
    'use strict';

    function Navigator () {

        let navigator = {
            /**
             * Returns an index of the server library
             */
            getServerLibraryIndex: function (callback) {
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

                let availableUpdates = {};

                downloader.downloadProjectList(function(success) {
                    if(success) {
                        for (let projectId of downloadIndex.getProjects()) {
                            let serverProject = downloadIndex.getProject(projectId);
                            let localProject = appIndex.getProject(projectId);
                            if (localProject === null || parseInt(localProject.date_modified) < parseInt(serverProject.date_modified)) {
                                // download languages of new or updated projects
                                downloader.downloadSourceLanguageList(projectId, function(success) {
                                    if(success) {
                                        for (let sourceLanguageId of downloadIndex.getSourceLanguages(projectId)) {
                                            let serverSourceLanguage = downloadIndex.getSourceLanguage(projectId, sourceLanguageId);
                                            let localSourceLanguage = appIndex.getSourceLanguage(projectId, sourceLanguageId);
                                            if (localSourceLanguage === null || parseInt(localSourceLanguage.date_modified) < parseInt(serverSourceLanguage.date_modified)) {
                                                // download resources for new or updated source languages
                                                downloader.downloadResourceList(projectId, sourceLanguageId, function(success) {
                                                    if(success) {
                                                        for (let resourceId of downloadIndex.getResources(projectId, sourceLanguageId)) {
                                                            let serverResource = downloadIndex.getResource(projectId, sourceLanguageId, resourceId);
                                                            let localResource = appIndex.getResource(projectId, sourceLanguageId, resourceId);
                                                            if (localResource === null || parseInt(localResource.date_modified) < parseInt(serverResource.date_modified)) {
                                                                // build update list
                                                                availableUpdates[projectId][sourceLanguageId].push(resourceId);
                                                            }
                                                        }
                                                    } else {
                                                        App.reporter.logWarning('The resource list could not be downloaded');
                                                    }
                                                });
                                            }
                                        }
                                    } else {
                                        App.reporter.logWarning('The source language list could not be downloaded');
                                    }
                                });
                            }
                        }
                        // TODO: download the rest
                        //downloader.downloadSourceLanguageList(pid);
                        //downloader.downloadResourceList(pid, slid);

                        if (typeof callback === 'function') {
                            callback(downloadIndex, availableUpdates);
                        }
                    } else {
                        App.reporter.logWarning('The project list could not be downloaded');
                    }
                });
            },

            /**
             * Returns a list of data to populate the list of projects the user can choose from
             */
            getProjectListData: function(callback) {
                // TODO: load data and return to callback
                callback();
            },

            /**
             * Returns a list of data to populate the list of chapters the user can choose from
             * @param callback
             */
            getChapterListData: function(callback) {
                // TODO: load data and return to callback
                callback();
            },

            /**
             * Returns a list of data to populate the list of frames the user can choose from
             * @param callback
             */
            getFrameListData: function(callback) {
                // TODO: load data and return to callback
                callback();
            }
        };
        return navigator;
    }

    exports.Navigator = Navigator;
}());
