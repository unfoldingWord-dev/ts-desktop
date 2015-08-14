//var Downloader = require('./downloader').Downloader;
//var Indexer = require('./indexer').Indexer;

;(function () {
    'use strict';

    function Navigator() {

        let navigator = {
            /**
             * Returns an index of the server library
             */
            getServerLibraryIndex: function(callback) {
                callback = callback;
                //let indexDir = App.configurator.getValue('indexDir');
                //let downloadIndex = new Indexer(indexDir, 'download_index');
                //let appIndex = new Indexer(indexDir, 'app_index');
                //let downloader = new Downloader(App.configurator.getValue('apiUrl'), downloadIndex, appIndex);
                // TODO: downloadProjectList, downloadSourceLanguageList, downloadResourceList
                // TODO: send download index to the callback
            }
        };
        return navigator;
    }

    exports.Navigator = Navigator;
}());
