
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

                downloader.downloadProjectList();
                // TODO: download the rest
                //downloader.downloadSourceLanguageList(pid);
                //downloader.downloadResourceList(pid, slid);

                if(typeof callback === 'function') {
                    callback(downloadIndex);
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
