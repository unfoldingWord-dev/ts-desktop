/**
 * Created by Emmitt on 6/26/2015.
 */
/* settings
 * TODO: Hook to configurator once it is done
 * */
var logPath = './log.txt';
var oauthToken = '';
var repoOwner = 'unfoldingWord-dev';
var repo = 'ts-desktop';
var maxLogFileKbs = 200;

var version = require('../../package.json').version;
var fs = require('fs');
var os = require('os');
var https = require('https');
var mkdirp = require('mkdirp');

var reporter = {
    logNotice: function (string, callback) {
        'use strict';
        if (!string) {
            throw new Error('reporter.logNotice requires a message.');
        }
        reporter.toLogFile('I', string, function () {
            if (typeof callback === 'function') {
                callback();
            }
        });
    },

    logWarning: function (string, callback) {
        'use strict';
        if (!string) {
            throw new Error('reporter.logWarning requires a message.');
        }
        reporter.toLogFile('W', string, function () {
            if (typeof callback === 'function') {
                callback();
            }
        });
    },

    logError: function (string, callback) {
        'use strict';
        if (!string) {
            throw new Error('reporter.logError requires a message.');
        }
        reporter.toLogFile('E', string, function () {
            if (typeof callback === 'function') {
                callback();
            }
        });
    },

    reportBug: function (string, callback) {
        'use strict';
        if (!string) {
            throw new Error('reporter.reportBug requires a message.');
        }
        reporter.formGithubIssue('Bug Report', string, null, function (res) {
            if (typeof callback === 'function') {
                callback(res);
            }
        });
    },

    reportCrash: function (string, crashFilePath, callback) {
        'use strict';
        reporter.formGithubIssue('Crash Report', string, crashFilePath, function (res) {
            if (typeof callback === 'function') {
                callback(res);
            }
        });
    },

    stackTrace: function () {
        'use strict';
        var err = new Error();
        return err.stack;
    },

    getLogPath: function () {
        'use strict';
        return logPath;
    },

    setLogPath: function (string) {
        'use strict';
        if (string) {
            logPath = string;
        } else {
            throw new Error('reporter.setLogPath() requires a string!');
        }
    },

    toLogFile: function (level, string, callback) {
        'use strict';
        /* We make 3 calls before processing who called the original
         *  log command; therefore, the 4th call will be the original caller.
         * */
        var location = reporter.stackTrace().split('\n')[4];
        try {
            location = location.split(/(\\|\/)/);
            location = location[location.length - 1];
            location = location.substr(0, location.length - 1);
        } catch (e) {
            throw new Error(e.message);
        }
        var date = new Date();
        date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        var message = date + ' ' + level + '/' + location + ': ' + string + '\r\n';
        var dir = logPath.split(/\\|\//);
        dir.pop();
        dir = dir.join('\\');
        if (dir === '') {
            dir = '.';
        }
        mkdirp(dir, function (e) {
            if (e) {
                throw new Error(e);
            } else {
                fs.appendFile(logPath, message, function (err) {
                    if (err) {
                        throw new Error(err.message);
                    }
                    if (typeof callback === 'function') {
                        callback();
                    }
                });
            }
        });

        reporter.truncateLogFile();
    },

    stringFromLogFile: function (filePath, callback) {
        'use strict';
        var readPath = logPath;
        if (filePath) {
            readPath = filePath;
        }
        fs.exists(readPath, function (exists) {
            if (exists) {
                fs.readFile(readPath, {encoding: 'utf8'}, function (err, data) {
                    if (err) {
                        if (typeof callback === 'function') {
                            callback('Could read log file. ERRNO: ' + err.number);
                        }
                        throw new Error(err.message);
                    }
                    if (typeof callback === 'function') {
                        callback(data);
                    }
                });
            } else {
                if (typeof callback === 'function') {
                    callback('No log file.');
                }
            }
        });
    },

    truncateLogFile: function () {
        'use strict';
        fs.stat(logPath, function (err, stats) {
            if (stats) {
                var kb = stats.size / 1024;
                if (kb >= maxLogFileKbs) {
                    reporter.stringFromLogFile(null, function (res) {
                        res = res.split('\n');
                        res = res.slice(res.length / 2, res.length - 1);
                        res = res.join('\n');
                        fs.unlink(logPath, function () {
                            fs.appendFile(logPath, res, function (err) {
                                if (err) {
                                    throw new Error(err.message);
                                }
                            });
                        });
                    });
                }
            }
        });
    },

    formGithubIssue: function (type, string, filePath, callback) {
        'use strict';
        var issueObject = {};
        issueObject.user = repoOwner;
        issueObject.repo = repo;
        issueObject.labels = [type, version];
        if (string) {
            if (string.length > 30) {
                issueObject.title = string.substr(0, 29) + '...';
            } else {
                issueObject.title = string;
            }
        } else {
            issueObject.title = type;
        }

        var bodyBuilder = [];
        /* user notes */
        if (string) {
            bodyBuilder.push('Notes\n======');
            bodyBuilder.push(string);
        }
        /* generated notes */
        bodyBuilder.push('\nEnvironment\n======');
        bodyBuilder.push('Environment Key | Value');
        bodyBuilder.push(':--: | :--:');
        bodyBuilder.push('Version |' + version);
        bodyBuilder.push('Operation System | ' + os.type());
        bodyBuilder.push('Platform | ' + os.platform());
        bodyBuilder.push('Release | ' + os.release());
        bodyBuilder.push('Architecture | ' + os.arch());
        if (type === 'Crash Report') {
            bodyBuilder.push('\nStack Trace\n======');
            bodyBuilder.push('```javascript');
            bodyBuilder.push(reporter.stackTrace());
            bodyBuilder.push('```');
        }
        bodyBuilder.push('\nLog History\n======');
        bodyBuilder.push('```javascript');
        reporter.stringFromLogFile(null, function (results) {
            if (filePath) {
                reporter.stringFromLogFile(filePath, function (crashFileResults) {
                    bodyBuilder.push(results);
                    bodyBuilder.push('```');
                    bodyBuilder.push('\nCrash File\n======');
                    bodyBuilder.push('```javascript');
                    bodyBuilder.push(crashFileResults);
                    bodyBuilder.push('```');
                    issueObject.body = bodyBuilder.join('\n');
                    reporter.sendIssueToGithub(issueObject, function (res) {
                        if (typeof callback === 'function') {
                            callback(res);
                        }
                    });
                });
            } else {
                bodyBuilder.push(results);
                bodyBuilder.push('```');
                issueObject.body = bodyBuilder.join('\n');
                reporter.sendIssueToGithub(issueObject, function (res) {
                    if (typeof callback === 'function') {
                        callback(res);
                    }
                });
            }
        });
    },

    sendIssueToGithub: function (issue, callback) {
        'use strict';
        var params = {};
        params.title = issue.title;
        params.body = issue.body;
        params.labels = issue.labels;
        var paramsJson = JSON.stringify(params);

        var urlPath = '/repos/' + issue.user + '/' + issue.repo + '/issues';
        var postOptions = {
            host: 'api.github.com',
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'User-Agent': 'ts-desktop',
                'Content-Type': 'application/json',
                'Content-Length': paramsJson.length,
                'Authorization': 'token ' + oauthToken
            }
        };

        var postReq = https.request(postOptions, function (res) {
            res.setEncoding('utf8');
            var completeData = '';
            res.on('data', function (partialData) {
                completeData += partialData;
            }).on('end', function () {
                if (typeof callback === 'function') {
                    callback(completeData);
                }
            });
        }).on('error', function (err) {
            throw new Error(err.message);
        });
        postReq.write(paramsJson);
        postReq.end();
    }
};

exports.logNotice = reporter.logNotice;
exports.logWarning = reporter.logWarning;
exports.logError = reporter.logError;
exports.reportBug = reporter.reportBug;
exports.reportCrash = reporter.reportCrash;
exports.getLogPath = reporter.getLogPath;
exports.setLogPath = reporter.setLogPath;
exports.stringFromLogFile = reporter.stringFromLogFile;
