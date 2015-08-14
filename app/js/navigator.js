
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
                callback = callback;
                let indexDir = App.configurator.getValue('indexDir');
                let downloadIndex = new Indexer('downloads');
                let appIndex = new Indexer('app');
                let downloader = new Downloader({
                    apiUrl: App.configurator.getValue('apiUrl')
                }, downloadIndex, appIndex);

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
