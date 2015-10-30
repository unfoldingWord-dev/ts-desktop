'use strict';

;(function () {

    function ContentValues () {
        let _this = this;
        _this.fields = [];
        _this.values = {};
        return {
            set: function (field, value) {
                if (typeof field !== 'undefined' && _this.fields.indexOf(field) === -1) {
                    _this.fields.push(field);
                }
                _this.values[':' + field] = value;
                return true;
            },
            get: function (field) {
                return _this.values[':' + field];
            },
            getFields: function () {
                return _this.fields;
            },
            getValues: function () {
                return _this.values;
            }
        };
    }
    ContentValues.prototype.valueOf = function () {
        return this.values;
    };

    exports.ContentValues = ContentValues;

}());
