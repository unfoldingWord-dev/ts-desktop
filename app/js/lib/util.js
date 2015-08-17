(function () {
    'use strict';


    /**
     * pathName() returns an absolutePathname
     * where a resource can be found on a filesystem
     * based pathname (usually derived for the API url)
     * and a baseDir that is the the resource directory
     * @deprecated please use the `path` module instead e.g. `path.join()`
     *
     * @param {String} pathname
     * @param {string} baseDir
     * @return {string} absolutePathname
     */
    function setPath () {
        throw new Error('setPath is deprecated. Please use the path module instead. e.g. path.join()');
    }

    /**
     * Retrieves a url property from an object
     * @param itemObj the object that contains the url
     * @param urlProp the name of the property in the object that contains the url
     * @param dropQuery if true the query string will be removed
     * @returns {*}
     */
    function getUrlFromObj (itemObj, urlProp) {
        if (arguments.length > 2 && arguments[2] === true) {
            return itemObj[urlProp].split('?')[0];
        }
        return itemObj[urlProp];
    }

    /**
     * Raises an exception along with some context to provide better debugging
     * @param e the exception to be raised
     * @param args arguments to be added to the exception message
     */
    function raiseWithContext (e, args) {
        e.message += '\nException Context:';
        for (let prop in args) {
            if (args.hasOwnProperty(prop)) {
                e.message += '\n\t' + prop + '=' + args[prop];
            }
        }
        e.message += '\n';
        throw e;
    }

    exports.raiseWithContext = raiseWithContext;
    exports.setPath = setPath;
    exports.getUrlFromObj = getUrlFromObj;

}());
