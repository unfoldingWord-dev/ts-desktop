'use strict';

jest.unmock('../src/js/reporter');

var config = {
    logPath: 'mylogpath.txt',
    verbose: false
};

describe('Reporter', () => {
    var utils, reporter;

    function checkLogMessage(title, body, level, message) {
        expect(utils.fs.appendFile.mock.calls.length).toEqual(1);
        expect(utils.fs.__lastWritten.message).toEqual(message);
        expect(utils.fs.__lastWritten.path).toEqual(config.logPath);
        expect(message).toMatch(new RegExp(title));
        expect(message).toMatch(new RegExp(body));
        expect(message).toMatch(new RegExp('\\s' + level + '\\/'));
        return message;
    }

    beforeEach(() => {
        utils = require('../src/js/lib/utils');
        var Reporter = require('../src/js/reporter').Reporter;
        reporter = new Reporter(config);
    });

    describe('logWarning', () => {
        it('should log a warning', () => {
            var title = 'bob';
            var body = 'Bob is a jerk';
            var level = 'W';
            var check = checkLogMessage.bind(null, title, body, level);

            return reporter.logWarning(title, body).then(check)
        });
    });

    describe('logError', () => {
        it('should log an error', () => {
            var title = 'Bad Date';
            var body = 'Joe ordered spaghetti and made a mess';
            var level = 'E';
            var check = checkLogMessage.bind(null, title, body, level);

            return reporter.logError(title, body).then(check);
        });
    });

    describe('logNotice', () => {
        it('should log a notice', () => {
            var title = 'You Got This';
            var body = 'Just do it, man!';
            var level = 'I';
            var check = checkLogMessage.bind(null, title, body, level);

            return reporter.logNotice(title, body).then(check);
        });
    });
});
