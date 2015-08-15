;(function() {
    "use strict";


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
     * Merges the properties of obj1 and obj2.
     * Properties in obj2 will overide duplicate properties in obj1
     * @param obj1
     * @param obj2
     */
    function unionObjects(obj1, obj2) {
        var obj3 = {};
        if(typeof obj1 === 'object' && typeof obj2 === 'object') {
            for (var prop1 in obj1) {
                if (obj1.hasOwnProperty(prop1)) {
                    obj3[prop1] = obj1[prop1];
                }
            }
            for (var prop2 in obj2) {
                if (obj2.hasOwnProperty(prop2)) {
                    obj3[prop2] = obj2[prop2];
                }
            }
        } else if(typeof obj1 === 'object') {
            obj3 = obj1;
        } else if(typeof obj2 === 'object') {
            obj3 = obj2;
        }
        return obj3;
    }

    exports.unionObjects = unionObjects;
    exports.setPath = setPath;
    exports.getUrlFromObj = getUrlFromObj;

}());
