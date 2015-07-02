/**
 * Created by Emmitt on 7/2/2015.
 */
var assert = require('assert');
var reporter = require('../../app/js/reporter');
var fs = require('fs');
var grunt = require('grunt');

/* TODO: log from configurator later */
var logPath = './';
var logName = 'log.txt';

describe('@Reporter', function() {

    describe('@logNotice', function() {
        var key = 'This is a test';
        var logFileResults = '';
        var textExpected = '';

        before(function(done){
            fs.exists(logPath+logName, function(exists){
                fs.unlink(logPath+logName, function(err) {
                    reporter.logNotice(key);

                    var date = new Date();
                    date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    //reporter.js:<line>:<column> this will need to be changed if the code changes
                    textExpected = date + ' I/reporter.js:23:3: ' + key + '\r\n';

                    reporter.stringFromLogFile(function(logResults){
                        logFileResults = logResults;
                        done()
                    });
                });
            });
        });
        it('should create a log file notice', function(done) {
            assert.equal(logFileResults, textExpected);
            fs.exists(logPath+logName, function(exists){
                fs.unlink(logPath+logName, function(err) {
                    done();
                });
            });
        });
    });

    describe('@logWarning', function() {
        var key = 'This is a test';
        var logFileResults = '';
        var textExpected = '';

        before(function(done){
            fs.exists(logPath+logName, function(exists){
                fs.unlink(logPath+logName, function(err) {
                    reporter.logWarning(key);

                    var date = new Date();
                    date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    //reporter.js:<line>:<column> this will need to be changed if the code changes
                    textExpected = date + ' W/reporter.js:55:3: ' + key + '\r\n';

                    reporter.stringFromLogFile(function(logResults){
                        logFileResults = logResults;
                        done()
                    });
                });
            });
        });
        it('should create a log file warning', function(done) {
            assert.equal(logFileResults, textExpected);
            fs.exists(logPath+logName, function(exists){
                fs.unlink(logPath+logName, function(err) {
                    done();
                });
            });
        });
    });

    describe('@logError', function() {
        var key = 'This is a test';
        var logFileResults = '';
        var textExpected = '';

        before(function(done){
            fs.exists(logPath+logName, function(exists){
                fs.unlink(logPath+logName, function(err) {
                    reporter.logError(key);

                    var date = new Date();
                    date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    //reporter.js:<line>:<column> this will need to be changed if the code changes
                    textExpected = date + ' E/reporter.js:87:3: ' + key + '\r\n';

                    reporter.stringFromLogFile(function(logResults){
                        logFileResults = logResults;
                        done()
                    });
                });
            });
        });
        it('should create a log file error', function(done) {
            assert.equal(logFileResults, textExpected);
            fs.exists(logPath+logName, function(exists){
                fs.unlink(logPath+logName, function(err) {
                    done();
                });
            });
        });
    });
});
