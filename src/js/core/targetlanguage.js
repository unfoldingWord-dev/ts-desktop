;(function () {
    "use strict";

    function TargetLanguage(parameters) {
        let code = parameters.code;
        let name = parameters.name;
        let region = parameters.region;
        let direction = parameters.direction;

        let _this = this;

        _this.getSlug = function () {
            return code;
        };
        _this.getRegion = function () {
            return region;
        };
        _this.getName = function () {
            return name;
        };
        _this.getDirection = function () {
            return direction;
        };

        return _this;
    }

    /**
     * Returns a new instance of a target language
     * @param parameters
     * @returns {TargetLanguage}
     */
    function newInstance(parameters) {
        return new TargetLanguage(parameters);
    }

    exports.newInstance = newInstance;
}());
