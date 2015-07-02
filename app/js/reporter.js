/**
 * Created by Emmitt on 6/26/2015.
 */
/* settings
 * TODO: Hook to configurator once it is done
 * */
var logPath = './';
var logName = 'log.txt';
var oauth_token = '';
var repoOwner = 'EmmittJ';
var repo = 'ts-desktop';

var version = require('../../package.json').version;
var fs = require('fs');
var os = require('os');
var https = require('https');

var reporter = {
    logNotice: function(string) {
        'use strict';
        reporter.toLogFile('I', string);
    },

    logWarning: function(string) {
        'use strict';
        reporter.toLogFile('W', string);
    },

    logError: function(string) {
        'use strict';
        reporter.toLogFile('E', string);
    },

    reportBug: function(string) {
        'use strict';
        reporter.formGithubIssue('Bug Report', string);
    },

    reportCrash: function(string) {
        'use strict';
        reporter.formGithubIssue('Crash Report', string);
    },

    stackTrace: function () {
        'use strict';
        var err = new Error();
        return err.stack;
    },

    toLogFile: function(level, string){
        'use strict';
        /* We make 3 calls before processing who called the original
         *  log command; therefore, the 4th call will be the original caller.
         * */
        var location = reporter.stackTrace().split('\n')[4];
        try {
            location = location.split('\\');
            location = location[location.length-1];
            location = location.substr(0,location.length-1);
        }
        catch(e){
            console.log(e);
        }
        var date = new Date();
        date = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        var message = date + ' ' + level + '/' + location + ': ' + string + '\r\n';
        fs.appendFile(logPath+logName, message, function(err) {
            if(err){return console.log(err);}
        });
    },

    stringFromLogFile: function(callback){
        'use strict';
        fs.exists(logPath+logName, function(exists){
            if(exists) {
                fs.readFile(logPath + logName, {encoding: 'utf8'}, function (err, data) {
                    if (err){
                        console.log(err);
                        callback('Could read log file. ERRNO: ' + err.number);
                    }
                    callback(data);
                });
            }
            else{
                callback('No log file.');
            }
        });
    },

    formGithubIssue: function(type, string){
        'use strict';
        var issueObject = {};
        issueObject.user = repoOwner;
        issueObject.repo = repo;
        issueObject.labels = [type, version];
        if(string){
            if(string.length > 30) {
                issueObject.title = string.substr(0, 29) + '...';
            }
            else{
                issueObject.title = string;
            }
        }
        else{
            issueObject.title = type;
        }

        var bodyBuilder = [];
        /* user notes */
        if(string) {
            bodyBuilder.push('Notes\n======');
            bodyBuilder.push(string);
        }
        /* generated notes */
        bodyBuilder.push('\nEnvironment\n======');
        bodyBuilder.push('Version: ' + version);
        bodyBuilder.push('Operation System: ' + os.type());
        bodyBuilder.push('Platform: ' + os.platform());
        bodyBuilder.push('Release: ' + os.release());
        bodyBuilder.push('Architecture: ' + os.arch());
        if(type === 'Crash Report') {
            bodyBuilder.push('\nStack Trace\n======');
            bodyBuilder.push(reporter.stackTrace());
        }
        bodyBuilder.push('\nLog History\n======');
        reporter.stringFromLogFile(function(results){
            bodyBuilder.push(results);
            issueObject.body = bodyBuilder.join('\n');
            reporter.sendIssueToGithub(issueObject);
        });
    },

    sendIssueToGithub: function(issue){
        'use strict';
        var params = {};
        params.title = issue.title;
        params.body = issue.body;
        params.labels = issue.labels;
        var paramsJson = JSON.stringify(params);

        var urlPath = '/repos/' + issue.user + '/' + issue.repo + '/issues';
        var post_options = {
            host: 'api.github.com',
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'User-Agent': 'ts-desktop',
                'Content-Type': 'application/json',
                'Content-Length': paramsJson.length,
                'Authorization': 'token ' + oauth_token
            }
        };

        var post_req = https.request(post_options, function(res){
            res.setEncoding('utf8');
            res.on('data', function(data) {
                if(data){
                    reporter.logNotice('Issue Submitted');
                }
                else{
                    reporter.logWarning('Issue was not able to submit');
                }
            });
        }).on('error', function(err){
            reporter.logError(err.message);
        });
        post_req.write(paramsJson);
        post_req.end();
    }
};

exports.logNotice = reporter.logNotice;
exports.logWarning = reporter.logWarning;
exports.logError = reporter.logError;
exports.reportBug = reporter.reportBug;
exports.reportCrash = reporter.reportCrash;
exports.stringFromLogFile = reporter.stringFromLogFile;
