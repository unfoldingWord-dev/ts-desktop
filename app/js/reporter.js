/**
 * Created by Emmitt on 6/26/2015.
 */
/* settings */
var oauth_token = "temp";
var host = "api.github.com";
var logPath = "./";
var logName = "log.txt";

var version = require("../../package.json").version;
var fs = require('fs');
var os = require('os');
var http = require('http');

var reporter = {
    logNotice: function(string) {
        'use strict';
        this.toLogFile(0, string);
    },
    logWarning: function(string) {
        'use strict';
        this.toLogFile(1, string);
    },
    logError: function(string) {
        'use strict';
        this.toLogFile(2, string);
    },
    reportBug: function(string) {
        'use strict';
        this.toGithubIssue(0, string);
    },
    reportCrash: function(string) {
        'use strict';
        this.toGithubIssue(1, string);
    },
    stackTrace: function () {
        'use strict';
        var err = new Error();
        return err.stack;
    },
    toLogFile: function(level, string){
        'use strict';
        var flag = "";
        switch(level) {
            case 0:
            default:
                flag = "I";
                break;
            case 1:
                flag = "W";
                break;
            case 2:
                flag = "E";
                break;

        }
        var date = new Date();
        var date = date.toLocaleDateString() + " " + date.toLocaleTimeString();
        var message = date + " " + flag + ": " + string + "\r\n";
        console.log(message);
        fs.appendFile(logPath+logName, message, function(err) {
            if(err) return console.log(err);
            console.log("The file was saved!");
        });
    },
    stringFromLogFile: function(callback){
        fs.exists(logPath+logName, function(exists){
            if(exists) {
                fs.readFile(logPath + logName, {encoding: 'utf8'}, function (err, data) {
                    if (err){
                        console.log(err);
                        callback("Could read log file. ERRNO: " + err.number);
                    }
                    callback(data);
                });
            }
            else
                callback("No log file.");
        });
    },
    toGithubIssue: function(type, string){
        'use strict';
        var flag = "";
        switch(type) {
            case 0:
            default:
                flag = "Bug Report";
                break;
            case 1:
                flag = "Crash Report";
                break;
        }

        var issueObject = {};
        issueObject.user = "EmmittJ";
        issueObject.repo = "ts-desktop";
        issueObject.labels = [flag, version];
        if(string){
            if(string.length > 30)
                issueObject.title = string.substr(0, 29) + "...";
            else
                issueObject.title = string;
        }
        else
            issueObject.title = flag;

        var bodyBuilder = [];
        /* user notes */
        if(string) {
            bodyBuilder.push("Notes\n======");
            bodyBuilder.push(string);
        }
        /* generated notes */
        bodyBuilder.push("\nEnvironment\n======");
        bodyBuilder.push("Version: " + version);
        bodyBuilder.push("Operation System: " + os.type());
        bodyBuilder.push("Platform: " + os.platform());
        bodyBuilder.push("Release: " + os.release());
        bodyBuilder.push("Architecture: " + os.arch());
        if(type == 1) {
            bodyBuilder.push("\nStack Trace\n======");
            bodyBuilder.push(this.stackTrace());
        }
        bodyBuilder.push("\nLog History\n======");
        this.stringFromLogFile(function(results){
            bodyBuilder.push(results);
            issueObject.body = bodyBuilder.join('\n');
            reporter.sendIssueToGithub(issueObject);
        });
    },
    sendIssueToGithub: function(issue){
        var params = {};
        params.title = issue.title;
        params.body = issue.body;
        params.labels = issue.labels;
        var paramsJson = JSON.stringify(params);

        var urlPath = "/repos/" + issue.user + "/" + issue.repo + "/issues";
        console.log(urlPath);
        var urlData = urlStringify(paramsJson);
        var post_options = {
            host: host,
            port: 443,
            path: urlPath,
            method: 'POST',
            headers: {
                'User-Agent': 'ts-desktop',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(urlData),
                'Authorization': "token " + oauth_token
            }
        };
        var post_req = http.request(post_options, function(res){
            console.log(res.statusCode);
            res.setEncoding("utf8");
            res.on("data", function(data) {
                process.stdout.write(data);
            });
        });
        post_req.on('error', function(err){
            console.log(err.message);
        });
        post_req.write(urlData + "\n");
        post_req.end();
    }
};
function urlStringify(json) {
    var str = [];
    for(var prop in json){
        var s = encodeURIComponent(prop) + '=' + encodeURIComponent(json[prop]);
        str.push(s);
    }
    return str.join('&');
}
reporter.reportBug();

exports.logNotice = reporter.logNotice;
exports.logWarning = reporter.logWarning;
exports.logError = reporter.logError;
exports.reportBug = reporter.reportBug;
exports.reportCrash = reporter.reportCrash;
