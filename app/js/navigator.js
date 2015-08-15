
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

                downloader.downloadProjectList();
                for(let serverProject of downloadIndex.getProjects()) {
                    let localProject = appIndex.getProject(serverProject.slug);
                    if(localProject === null || parseInt(localProject.date_modified) < parseInt(serverProject.date_modified)) {
                        // download languages of new or updated projects
                        downloader.downloadSourceLanguageList(serverProject.slug);
                        for(let serverSourceLanguage of downloadIndex.getSourceLanguages(serverProject.slug)) {
                            let localSourceLanguage = appIndex.getSourceLanguage(serverProject.slug, serverSourceLanguage.slug);
                            if(localSourceLanguage === null || parseInt(localSourceLanguage.date_modified) < parseInt(serverSourceLanguage.date_modified)) {
                                // download resources for new or updated source languages
                                downloader.downloadResourceList(serverProject.slug, serverSourceLanguage.slug);
                                for(let serverResource of downloadIndex.getResources(serverProject.slug, serverSourceLanguage.slug)) {
                                    let localResource  = appIndex.getResource(serverProject.slug, serverSourceLanguage.slug, serverResource.slug);
                                    if(localResource === null || parseInt(localResource.date_modified) < parseInt(serverResource.date_modified)) {
                                        // build update list
                                        availableUpdates[serverProject.slug][serverSourceLanguage.slug].push(serverResource.slug);
                                    }
                                }
                            }
                        }
                    }
                }
                // TODO: download the rest
                //downloader.downloadSourceLanguageList(pid);
                //downloader.downloadResourceList(pid, slid);

                if(typeof callback === 'function') {
                    callback(downloadIndex, availableUpdates);
                }
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
