
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
                //downloader.downloadSourceLanguageList(pid);
                //downloader.downloadResourceList(pid, slid);

                if(typeof callback === 'function') {
                    callback(downloadIndex);
                }
                // TODO: downloadProjectList, downloadSourceLanguageList, downloadResourceList
                // TODO: send download index to the callback
            }
        };
        return navigator;
    }

    exports.Navigator = Navigator;
}());
