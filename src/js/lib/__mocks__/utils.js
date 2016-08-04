'use strict';

var __lastWritten = {};
var __logData = {};

var utils = {
	fs: {
		get __lastWritten () {
			return __lastWritten;
		},

        get __logData() {
		    return __logData;
        },

		appendFile: jest.fn(function (path, message) {
			__lastWritten.path = path;
			__lastWritten.message = message;
            if(!__logData[path]) {
                __logData[path] = message;
            } else {
                __logData[path] += message;
            }
			return Promise.resolve();
		}),

        writeFile: jest.fn(function(path, message) {
            __logData[path] = message;
            __lastWritten.path = path;
            __lastWritten.message = message;
            return Promise.resolve();
        }),

        readFile: jest.fn(function(path) {
           return Promise.resolve();
        }),

		mkdirs: function () {
			return Promise.resolve();
		},

		stat: function () {
			return Promise.resolve({});
		}
	}
};

module.exports = utils;
