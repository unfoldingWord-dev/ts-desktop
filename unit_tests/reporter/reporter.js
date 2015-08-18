'use strict';

;(function () {

    let assert = require('assert');
    let fs = require('fs');
    let Reporter = require('../../app/js/reporter').Reporter;
    let version = require('../../package.json').version;
    let Configurator = require('../../app/js/configurator').Configurator;
    let reporterConfigurator = new Configurator();
    let reporterDefaultConfig = require('../../app/config/defaults');
    let rimraf = require('rimraf');
    let jsonfile = require('jsonfile');

    reporterConfigurator.setStorage({});
    reporterConfigurator.loadConfig(reporterDefaultConfig);
    let privateConfPath = './app/config/private.json';
    if (fs.existsSync(privateConfPath)) {
        let stats = fs.lstatSync(privateConfPath);
        if (stats.isFile()) {
            let reporterPrivateConfig = jsonfile.readFileSync(privateConfPath);
            reporterConfigurator.loadConfig(reporterPrivateConfig);
        }
    }

    let logPath = 'unit_tests/reporter/log.txt';

    let reporter = new Reporter({
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
            let key = 'This is a test';
            let logFileResults = '';
            let textExpected = '';

            before(function (done) {
                reporter.logNotice(key, function () {
                    let date = new Date();
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
            let key = 'This is a test';
            let logFileResults = '';
            let textExpected = '';

            before(function (done) {
                reporter.logWarning(key, function () {
                    let date = new Date();
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
            let key = 'This is a test';
            let logFileResults = '';
            let textExpected = '';

            before(function (done) {
                reporter.logError(key, function () {
                    let date = new Date();
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
                let title = '[Automated] Bug Report';
                let labels = [version, 'bug report'];
                labels.sort(function (a, b) {
                    return a > b;
                });

                let githubResponse = '';

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

                        for (let i = 0; i < githubResponse.labels.length; i++) {
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
                let title = '[Automated] Crash Report';
                let labels = [version, 'crash report'];
                labels.sort(function (a, b) {
                    return a > b;
                });

                let githubResponse = '';

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

                        for (let i = 0; i < githubResponse.labels.length; i++) {
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
