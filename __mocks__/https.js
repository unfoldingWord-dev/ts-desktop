'use strict';

var callbacks = {};
var responseMessage = 'success';
var statusCode = 200;
var lastWritten = '';
var lastOptions = {};

var https = {
    get __lastOptions () {
        return lastOptions;
    },

    get __lastWritten () {
       return lastWritten;
    },

    set __setResponse (message) {
        responseMessage = message;
    },

    set __setStatusCode(code) {
        statusCode = code;
    },

    request: jest.fn(function(options, callback) {
        lastOptions = options;
        return {
            on: function(type, callback) {
                callbacks[type] = callback;
                return this;
            },
            write: function(data) {
                lastWritten = data;
            },
            end: function() {
                var resourceCallbacks = {};
                callback({
                    setEncoding: function(encoding) {

                    },
                    on: function(type, resCallback) {
                        resourceCallbacks[type] = resCallback;

                        if(type === 'end') {
                            resourceCallbacks['data'](responseMessage);
                            resourceCallbacks['end']();
                        }
                        return this;
                    },
                    get statusCode () {
                        return statusCode
                    }
                });
            }
        };
    })
};

module.exports = https;
