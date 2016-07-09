'use strict';

var utils = {}; //=jest.genMockFromModule('../utils');

var __lastWritten = {};

utils.fs = {

	get __lastWritten () {
		return __lastWritten;
	},

	appendFile: jest.fn(function (path, message) {
		__lastWritten.path = path;
		__lastWritten.message = message;
		return Promise.resolve();
	}),

	mkdirs: function () {
		return Promise.resolve();
	},

	stat: function () {
		return Promise.resolve({});
	}
};

module.exports = utils;
