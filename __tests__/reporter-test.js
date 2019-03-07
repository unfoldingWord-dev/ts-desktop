'use strict';

jest.mock('https');
jest.mock('../src/js/lib/utils');

var config = {
    logPath: 'mylogpath.txt',
    verbose: false
};

describe('Reporter', () => {
    var utils, reporter;

    function checkLogMessage(title, level, message) {
        expect(utils.fs.appendFile.mock.calls.length).toEqual(1);
        expect(utils.fs.__lastWritten.message).toEqual(message);
        expect(utils.fs.__lastWritten.path).toEqual(config.logPath);
        title && expect(message).toMatch(new RegExp(title));
        expect(message).toMatch(new RegExp('\\s' + level + '\\/'));
        return message;
    }

    function checkStringMessage(body, message) {
        expect(message).toMatch(new RegExp(body));
        return message;
    }

    function checkObjectMessage(body, message) {
        var stuff = message.split('\n').slice(1).join('');
        var m = JSON.stringify(JSON.parse(stuff));
        expect(m).toEqual(JSON.stringify(body));
        return message;
    }

    function testString(level, method) {
        var title = 'This is a string log';
        var body = 'Bob is silly';
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(checkStringMessage.bind(null, body));
    }

    function testFlatObject(level, method) {
        var title = 'This is a flat object log';
        var body = { data: 'bob is silly', type: 'flowers'};
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(checkObjectMessage.bind(null, body));
    }

    function testDeepObject(level, method) {
        var title = 'This is a deep object log';
        var body = { data: ['Bob is silly', 'bacon', 'cheese'], type: {plants:'flowers'}};
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(checkObjectMessage.bind(null, body));
    }

    function testArray(level, method) {
        var title = 'This is an array log';
        var body = ['bob', 'is', 'silly'];
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(checkObjectMessage.bind(null, body));
    }

    function testCustomToString(level, method) {
        var title = 'This is custom toString log';
        var body = { data: 'this will not be seen', toString:function() {return 'hello world!';}};
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(checkStringMessage.bind(null, body));
    }

    function testTitle(level, method, title) {
        var body = 'Bob is silly';
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(checkStringMessage.bind(null, body));
    }

    function testBody(level, method, body) {
        var title = 'This is an empty error log';
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(function(message) {
                var lines = message.split('\n');
                expect(lines.length).toEqual(2);
                expect(lines.pop()).toEqual('');
            });
    }

    function testTitleAndBody(level, method, title, body) {
        var check = checkLogMessage.bind(null, title, level);

        return reporter[method](body, title)
            .then(check)
            .then(function(message) {
                var lines = message.split('\n');
                expect(lines.length).toEqual(2);
                expect(lines.pop()).toEqual('');
                expect(lines.pop().split(':').pop().trim()).toEqual('');
            });
    }

    function testLogTypes(level, method) {
        it('should log a warning', () => {
            return testString(level, method);
        });

        it('should log a warning with a deep object', () => {
            return testDeepObject(level, method);
        });

        it('should log a warning with a flat object', () => {
            return testFlatObject(level, method);
        });

        it('should log a warning with an array', () => {
            return testArray(level, method);
        });

        it('should log a notice with an object with custom toString', () => {
            return testCustomToString(level, method);
        });

        it('should log a notice with a null title', () => {
            return testTitle(level, method, null);
        });

        it('should log a notice with a undefined title', () => {
            return testTitle(level, method, undefined);
        });

        it('should log a notice with an empty title', () => {
            return testTitle(level, method, '');
        });

        it('should log a notice with a null error', () => {
            return testBody(level, method, null);
        });

        it('should log a notice with a undefined error', () => {
            return testBody(level, method, undefined);
        });

        it('should log a notice with an empty error', () => {
            return testBody(level, method, '');
        });

        it('should log a notice with an empty title and error', () => {
            return testTitleAndBody(level, method, null, null);
        });
    }

    beforeEach(() => {
        utils = require('../src/js/lib/utils');
        var Reporter = require('../src/js/reporter').Reporter;
        reporter = new Reporter(config);
        jest.clearAllMocks();
    });

    describe('logWarning', () => {
        const level = 'W';
        const method = 'logWarning';

        testLogTypes(level, method);
    });

    describe('logError', () => {
        const level = 'E';
        const method = 'logError';

        testLogTypes(level, method);
    });

    describe('logNotice', () => {
        const level = 'I';
        const method = 'logNotice';

        testLogTypes(level, method);
    });

    it('should clear the contents of the log', () => {
        var data = 'hello world';
        // expect(utils.fs.__logData[config.logPath]).toBeFalsy();
        utils.fs.writeFile(config.logPath, data);
        expect(utils.fs.__logData[config.logPath]).toEqual(data);
        return reporter.clearLog().then(function() {
            expect(utils.fs.__logData[config.logPath]).toBeFalsy();
        }).then(function() {
            // TRICKY: make sure multiple clears doesn't break things
            return reporter.clearLog();
        }).then(function() {
            expect(utils.fs.__logData[config.logPath]).toBeFalsy();
        });
    });
});

describe('ReporterNetworkCalls', () => {
    var utils, reporter, https;

    describe('canReportToGithub', () => {
       it('should not be able to report to github with no config', () => {
           utils = require('../src/js/lib/utils');
           var Reporter = require('../src/js/reporter').Reporter;
           reporter = new Reporter();
           expect(reporter.canReportToGithub()).toBeFalsy();
       });

        it('should not be able to report to github with no token', () => {
            utils = require('../src/js/lib/utils');
            var Reporter = require('../src/js/reporter').Reporter;
            reporter = new Reporter({
                repoOwner:'owner',
                repo: 'repo'
            });
            expect(reporter.canReportToGithub()).toBeFalsy();
        });

        it('should not be able to report to github with no repo', () => {
            utils = require('../src/js/lib/utils');
            var Reporter = require('../src/js/reporter').Reporter;
            reporter = new Reporter({
                repoOwner:'owner',
                oauthToken: 'token'
            });
            expect(reporter.canReportToGithub()).toBeFalsy();
        });

        it('should not be able to report to github with no owner', () => {
            utils = require('../src/js/lib/utils');
            var Reporter = require('../src/js/reporter').Reporter;
            reporter = new Reporter({
                repoOwner:'repo',
                oauthToken: 'token'
            });
            expect(reporter.canReportToGithub()).toBeFalsy();
        });

        it('should be able to report to github with config', () => {
            utils = require('../src/js/lib/utils');
            var Reporter = require('../src/js/reporter').Reporter;
            reporter = new Reporter({
                repoOwner: 'owner',
                repo:'repo',
                oauthToken: 'token'
            });
            expect(reporter.canReportToGithub()).toBeTruthy();
        });
    });

    describe('reportBug', () => {

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should successfully submit the report', () => {
            // success, auth failed, error
            https = require('https');
            var Reporter = require('../src/js/reporter').Reporter;
            reporter = new Reporter({
                repoOwner: 'owner',
                repo:'repo',
                oauthToken: 'token'
            });

            var expectedResponse = 'bug report successfully submitted';
            var bugTitle = 'my bug';
            https.__setResponse = expectedResponse;

            return reporter.reportBug(bugTitle)
                .then(function(response) {
                    expect(response).toEqual(expectedResponse);
                    expect(https.__lastOptions.method).toEqual('POST');
                    expect(https.__lastOptions.port).not.toEqual(80);
                    expect(https.__lastWritten).toMatch(new RegExp(bugTitle));
                });
        });

        it('should receive an error while submitting the report', () => {
            var Reporter = require('../src/js/reporter').Reporter;
            reporter = new Reporter({
                repoOwner: 'owner',
                repo:'repo',
                oauthToken: 'token'
            });

            // set response type

            https = require('https');
            https.__setStatusCode = 400;

            return reporter.reportBug("my bug!")
                .then(function(response) {
                    expect(false).toBeFalsy();
                }).catch(function(err) {
                    expect(true).toBeTruthy();
                });
        });

        it('should receive an error while submitting with incomplete credentials', () => {
            var Reporter = require('../src/js/reporter').Reporter;
            reporter = new Reporter({
                repoOwner: 'owner',
                repo:'repo'
            });

            // set response type
            https = require('https');

            return reporter.reportBug("my bug!")
                .then(function(response) {
                    expect(false).toBeFalsy();
                }).catch(function(err) {
                    expect(https.request.mock.calls.length).toEqual(0);
                    expect(true).toBeTruthy();
                });
        });
    });
});
