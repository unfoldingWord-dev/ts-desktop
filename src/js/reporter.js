// reporter module

'use strict';

let fs = require('fs');
let os = require('os');
let https = require('https');
let utils = require('./lib/utils');
let path = require('path');
let moment = require('moment');

function Reporter (args) {

    args = args || {};

    let _this = this;
    let logPath = path.normalize(args.logPath || './log.txt');
    let oauthToken = args.oauthToken || '';
    let repoOwner = args.repoOwner || '';
    let repo = args.repo || '';
    let maxLogFileKb = args.maxLogFileKb || 200;
    let appVersion = args.appVersion || '0.0.0';
    let verbose = args.verbose || false;

    var convertError = function (err) {
        if(!err) return '';

        var indentLines = function (s) {
            return s.split('\n').map(function (line) {
                return '\t' + line;
            }).join('\n');
        };

        var shouldStringify = Array.isArray(err) || err.toString() === '[object Object]';
        var converted = shouldStringify ? JSON.stringify(err, null, 2) : err.toString();

        return indentLines(converted);
    };

    var addTitle = function (err, title) {
        var shouldHaveNewLine = !!err;
        var pre = (title || '') + (shouldHaveNewLine ? '\n' : '');
        return pre + err;
    };

    var makeMessage = function (err, title) {
        var e = convertError(err);
        return addTitle(e, title);
    };

    var log = function (level, err, title, stackModifier) {
        err = err || '';
        stackModifier = stackModifier || 0;

        var msg = makeMessage(err, title);

        return _this.toLogFile(level, msg, stackModifier);
    };

    _this.logWarning = log.bind(_this, 'W');
    _this.logError = log.bind(_this, 'E');
    _this.logNotice = log.bind(_this, 'I');

    _this.clearLog = function () {
        return utils.fs.writeFile(logPath, '');
    };

    /**
     * Sends a bug report to github
     * @param string the bug report
     * @param callback deprecated
     */
    _this.reportBug = function (string, callback) {
        if (!string) {
            return Promise.reject('reporter.reportBug requires a message.')
        }
        return _this.formGithubIssue('bug report', string, null);
    };

    /**
     *
     * @param string
     * @param crashFilePath
     * @param callback
     */
    _this.reportCrash = function (string, crashFilePath, callback) {
        return _this.formGithubIssue('crash report', string, crashFilePath);
    };

    _this.stackTrace = function () {
        let err = new Error();
        return err.stack;
    };

    _this.toLogFile = function (level, string, stackModifier) {
        /* We make 3 calls before processing who called the original
         *  log command; therefore, the 4th call will be the original caller.
         */
        let callNumber = 4 + stackModifier;
        let location = _this.stackTrace()
                            .split('\n')[callNumber]
                            .split(/(\\|\/)/)
                            .pop()
                            .slice(0,-1);

        let date = moment().format('YYYY-MM-DD HH:m:s');

        let message = date + ' ' + level + '/' + location + ': ' + string + '\n';

        let dir = path.dirname(logPath);

        if (verbose) {
            let levels = {
                'I': 'info',
                'W': 'warn',
                'E': 'error'
            };
            let type = levels[level];

            console[type](message);
        }

        return utils.fs.mkdirs(dir).then(function () {
            return utils.fs.appendFile(logPath, message);
        }).then(function () {
            return _this.truncateLogFile();
        }).then(function () {
            return message;
        });
    };

    _this.stringFromLogFile = function (filePath) {
        return utils.fs.readFile(filePath || logPath);
    };

    _this.truncateLogFile = function () {
        return utils.fs.stat(logPath).then(function (stats) {
            let kb = stats.size / 1024;

            if (kb >= maxLogFileKb) {
                return _this.stringFromLogFile().then(function (res) {
                    var lines = res.split('\n');
                    return lines.slice(Math.ceil(lines.length / 2), lines.length - 1)
                                .join('\n');
                }).then(function (res) {
                    return utils.fs.unlink(logPath).then(function () {
                        return utils.fs.appendFile(logPath, res);
                    });
                });
            }
        }).catch(function () {
            return false;
        });
    };

    _this.formGithubIssue = function (type, string, filePath) {
        let issueObject = {};
        issueObject.user = repoOwner;
        issueObject.repo = repo;
        issueObject.labels = [type, appVersion];
        if (string) {
            if (string.length > 30) {
                issueObject.title = string.substr(0, 29) + '...';
            } else {
                issueObject.title = string;
            }
        } else {
            issueObject.title = type;
        }

        let bodyBuilder = [];
        /* user notes */
        if (string) {
            bodyBuilder.push('Notes\n======');
            bodyBuilder.push(string);
        }
        /* generated notes */
        bodyBuilder.push('\nEnvironment\n======');
        bodyBuilder.push('Environment Key | Value');
        bodyBuilder.push(':--: | :--:');
        bodyBuilder.push('Version |' + appVersion);
        bodyBuilder.push('Operating System | ' + os.type());
        bodyBuilder.push('Platform | ' + os.platform());
        bodyBuilder.push('Release | ' + os.release());
        bodyBuilder.push('Architecture | ' + os.arch());
        if (type === 'crash report') {
            bodyBuilder.push('\nStack Trace\n======');
            bodyBuilder.push('```javascript');
            bodyBuilder.push(_this.stackTrace());
            bodyBuilder.push('```');
        }
        bodyBuilder.push('\nLog History\n======');
        bodyBuilder.push('```javascript');

        // TODO: this code is crazy. fix it!
        return _this.stringFromLogFile(null)
            .then(function (results) {
                if (filePath) {
                    return _this.stringFromLogFile(filePath)
                        .then(function (crashFileResults) {
                            bodyBuilder.push(results);
                            bodyBuilder.push('```');
                            bodyBuilder.push('\nCrash File\n======');
                            bodyBuilder.push('```javascript');
                            bodyBuilder.push(crashFileResults);
                            bodyBuilder.push('```');
                            issueObject.body = bodyBuilder.join('\n');
                            return _this.sendIssueToGithub(issueObject);
                        });
                } else {
                    bodyBuilder.push(results);
                    bodyBuilder.push('```');
                    issueObject.body = bodyBuilder.join('\n');
                    return _this.sendIssueToGithub(issueObject);
                }
            });
    };

    _this.sendIssueToGithub = function (issue) {
        if(!_this.canReportToGithub()) return Promise.reject({message:'Missing credentials'});

        let params = {};
        params.title = issue.title;
        params.body = issue.body;
        params.labels = issue.labels;
        let payload = JSON.stringify(params);

        let urlPath = '/repos/' + issue.user + '/' + issue.repo + '/issues';
        let postOptions = {
            host: 'api.github.com',
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'User-Agent': 'ts-desktop',
                'Content-Type': 'application/json',
                'Content-Length': payload.length,
                'Authorization': 'token ' + oauthToken
            }
        };

        return new Promise(function(resolve, reject) {
            let postReq = https.request(postOptions, function (res) {
                res.setEncoding('utf8');
                let completeData = '';
                res.on('data', function (partialData) {
                    completeData += partialData;
                }).on('end', function () {
                    if(res.statusCode != 201) {
                        console.log(res);
                        reject(JSON.parse(completeData));
                    } else {
                        resolve(completeData);
                    }
                });
            }).on('error', reject);
            postReq.write(payload);
            postReq.end();
            _this.clearLog();
        });
    };

    _this.canReportToGithub = function () {
        return !!(repo && repoOwner && oauthToken);
    };

    return _this;
}

module.exports.Reporter = Reporter;
