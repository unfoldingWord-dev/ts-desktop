// library module

;(function () {
    'use strict';

    let Configurator = require('./configurator').Configurator,
        configurator = new Configurator();

    /**
     *  Library module handles sourceTranslation (projects, e.g. Genesis, OBS)
	 */

    function Library (appIndex) {
        return {
            get projects () {
                return appIndex.getProjects();
            },

            getSourceLanguages: function (project) {
            	// A source language is filtered based on what translations actually exist.
            	// E.g., English is available because there a translation exists like ESV, NASB.
            	return appIndex.getSourceLanguages(project);
            }
        };
    }

    exports.Library = Library;
}());
