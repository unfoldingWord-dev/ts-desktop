jest.unmock('../src/js/reporter');

var config = {
	logPath: 'mylogpath.txt',
	verbose: false
};

describe('Reporter', () => {

	describe('logWarning', () => {
		it('should log a warning', () => {
			var utils = require('../src/js/lib/utils');
			var Reporter = require('../src/js/reporter').Reporter;
			var reporter = new Reporter(config);

			return reporter.logWarning('bob', 'Bob is a jerk').then(function (message) {
				expect(utils.fs.appendFile.mock.calls.length).toEqual(1);
				expect(utils.fs.__lastWritten.message).toEqual(message);
				expect(utils.fs.__lastWritten.path).toEqual(config.logPath);
				expect(message).toMatch(/bob/);
				expect(message).toMatch(/Bob is a jerk/);
			});
		});
	});
});