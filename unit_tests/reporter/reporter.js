var assert = require('assert');
var fs = require('fs');
var Reporter = require('../../app/js/reporter').Reporter;
var version = require('../../package.json').version;
var Configurator = require('../../app/js/configurator').Configurator;
var reporterConfigurator = new Configurator();
var reporterDefaultConfig = require('../../app/config/defaults');
var rimraf = require('rimraf');
var jsonfile = require('jsonfile');

(function () {
    'use strict';

    reporterConfigurator.setStorage({});
    reporterConfigurator.loadConfig(reporterDefaultConfig);
    let privateConfPath = './app/config/private.json';
    if (fs.existsSync(privateConfPath)) {
        var stats = fs.lstatSync(privateConfPath);
        if (stats.isFile()) {
            var reporterPrivateConfig = jsonfile.readFileSync(privateConfPath);
            reporterConfigurator.loadConfig(reporterPrivateConfig);
        }
    }

    var logPath = 'unit_tests/reporter/log.txt';

    var reporter = new Reporter({
        logPath: logPath,
        oauthToken: reporterConfigurator.getValue('oauthToken'),
        repoOwner: reporterConfigurator.getValue('repoOwner'),
        repo: reporterConfigurator.getValue('repo'),
        maxLogFileKb: reporterConfigurator.getValue('maxLogFileKb'),
        appVersion: version
    });

    describe('@Reporter', function () {
        beforeEach(function (done) {
            rimraf(logPath, function () {
                done();
            });
        });

        after(function (done) {
            rimraf(logPath, function () {
                done();
            });
        });

        //careful when editing this file as the expected strings are hardcoded with line numbers
        describe('@logNotice', function () {
            var key = 'This is a test';
            var logFileResults = '';
            var textExpected = '';

            before(function (done) {
                reporter.logNotice(key, function () {
                    var date = new Date();
                    date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    //reporter.js:<line>:<column> this will need to be changed if the code changes
                    textExpected = date + ' I/reporter.js:56:26: ' + key + '\n';

                    reporter.stringFromLogFile(null, function (logResults) {
                        logFileResults = logResults;
                        done();
                    });
                });
            });
            it('should create a log file notice', function (done) {
                assert.equal(logFileResults, textExpected);
                done();
            });
        });

        describe('@logWarning', function () {
            var key = 'This is a test';
            var logFileResults = '';
            var textExpected = '';

            before(function (done) {
                reporter.logWarning(key, function () {
                    var date = new Date();
                    date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    //reporter.js:<line>:<column> this will need to be changed if the code changes
                    textExpected = date + ' W/reporter.js:80:26: ' + key + '\n';

                    reporter.stringFromLogFile(null, function (logResults) {
                        logFileResults = logResults;
                        done();
                    });
                });
            });
            it('should create a log file warning', function (done) {
                assert.equal(logFileResults, textExpected);
                done();
            });
        });

        describe('@logError', function () {
            var key = 'This is a test';
            var logFileResults = '';
            var textExpected = '';

            before(function (done) {
                reporter.logError(key, function () {
                    var date = new Date();
                    date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                    //reporter.js:<line>:<column> this will need to be changed if the code changes
                    textExpected = date + ' E/reporter.js:104:26: ' + key + '\n';

                    reporter.stringFromLogFile(null, function (logResults) {
                        logFileResults = logResults;
                        done();
                    });
                });
            });
            it('should create a log file error', function (done) {
                assert.equal(logFileResults, textExpected);
                done();
            });
        });

        /* The tests below are activated by a flag at the top of the code
         * They are disabled by default since they require a bit of configuration
         * with an OAUTH Token and a user/repo name given. They also require an
         * active internet connection
         * */
        describe('@reportBug', function () {
            if (reporter.canReportToGithub()) {
                var title = '[Automated] Bug Report';
                var labels = [version, 'bug report'];
                labels.sort(function (a, b) {
                    return a > b;
                });

                var githubResponse = '';

                before(function (done) {
                    reporter.reportBug(title, function (res) {
                        githubResponse = JSON.parse(res);
                        if (githubResponse.message) {
                            assert.fail(false, true, githubResponse.message, '=');
                        }
                        done();
                    });
                });

                describe('@reportBugLabels', function () {
                    it('should compare the labels of the issue', function () {
                        assert.equal(githubResponse.labels.length, labels.length);

                        githubResponse.labels.sort(function (a, b) {
                            return a.name > b.name;
                        });

                        for (var i = 0; i < githubResponse.labels.length; i++) {
                            assert.equal(githubResponse.labels[i].name, labels[i]);
                        }
                    });
                });

                describe('@reportBugTitle', function () {
                    it('should compare the title of the issue', function () {
                        assert.equal(githubResponse.title, title);
                    });
                });
            }
        });

        describe('@reportCrash', function () {
            if (reporter.canReportToGithub()) {
                var title = '[Automated] Crash Report';
                var labels = [version, 'crash report'];
                labels.sort(function (a, b) {
                    return a > b;
                });

                var githubResponse = '';

                before(function (done) {
                    reporter.reportCrash(title, null, function (res) {
                        githubResponse = JSON.parse(res);
                        if (githubResponse.message) {
                            assert.fail(false, true, githubResponse.message, '=');
                        }
                        done();
                    });
                });

                describe('@reportCrashLabels', function () {
                    it('should compare the labels of the issue', function () {
                        assert.equal(githubResponse.labels.length, labels.length);

                        githubResponse.labels.sort(function (a, b) {
                            return a.name > b.name;
                        });

                        for (var i = 0; i < githubResponse.labels.length; i++) {
                            assert.equal(githubResponse.labels[i].name, labels[i]);
                        }
                    });
                });

                describe('@reportCrashTitle', function () {
                    it('should compare the title of the issue', function () {
                        assert.equal(githubResponse.title, title);
                    });
                });
            }
        });
    });

})();
