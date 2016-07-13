'use strict';

var callbacks = {};
var responseMessage = 'success';
var shouldError = false;

var https = {

    set __setResponse (message) {
        responseMessage = message;
    },

    set __setShouldError(error) {
        shouldError = !!error;
    },

    request: jest.fn(function(options, callback) {
        return {
            on: function(type, callback) {
                callbacks[type] = callback;
                return this;
            },
            write: function(data) {},
            end: function() {
                var resourceCallbacks = {};
                callback({
                    setEncoding: function(encoding) {

                    },
                    on: function(type, resCallback) {
                        resourceCallbacks[type] = resCallback;

                        if(type === 'end') {
                            if (shouldError) {
                                callbacks['error']();
                            } else {
                                resourceCallbacks['data'](responseMessage);
                                resourceCallbacks['end']();
                            }
                        }
                        return this;
                    }
                });
            }
        };
    })
};

module.exports = https;
