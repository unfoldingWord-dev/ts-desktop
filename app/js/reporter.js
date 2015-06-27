/**
 * Created by Emmitt on 6/26/2015.
 */
var version = require("../../package.json").version;

var reporter = {
    logNotice: function(string) {
        'use strict';
        alert("Hello 1");
        var log = {};
        alert("Hello 2");
        log.timeStamp = new Date();
        alert("Hello 3");
        log.level = "Information";
        alert("Hello 4");
        log.message = string;
        alert("Hello 5");
        log.location = this.caller.toString();
        alert("Hello 6");
        log.appVersion = version;
        alert("Hello 7");
        log.stackTrace = this.stacktrace();
        alert("Hello 8");
    },
    logWarning: function(string) {
        'use strict';
        //TODO: implement
        return 0;
    },
    logError: function(string) {
        'use strict';
        //TODO: implement
        return false;
    },
    reportBug: function(string) {
        'use strict';
        //TODO: implement
    },
    reportCrash: function(string) {
        'use strict';
        //TODO: implement
    },
    stacktrace: function () {
        var err = new Error();
        return err.stack;
    }
};

reporter.logNotice("Hello");

exports.logNotice = reporter.logNotice;
exports.logWarning = reporter.logWarning;
exports.logError = reporter.logError;
exports.reportBug = reporter.reportBug;
exports.reportCrash = reporter.reportCrash;
