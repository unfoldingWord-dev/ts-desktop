'use strict';

var exec = require('child_process').exec;

module.exports = function cmdr (paths) {

	const pathStr = (function makePathString (paths) {
	    if (paths && paths.length && process.platform !== 'win32') {
	        return 'PATH=' + paths.join(':') + ':$PATH ';
	    }

	    return '';
	})(paths);

	return function cmd(s) {
	    var str = s || '';

	    return {
	        cd: function (dir) {
	            return cmd(str + 'cd "' + dir + '"');
	        },

	        get and () {
	            return cmd(str + ' && ');
	        },

	        get then () {
	            var c = process.platform === 'win32' ? '& ' : '; ';

	            return cmd(str + c);
	        },

	        get or () {
	            return cmd(str + ' || ');
	        },

	        set: function (name, val) {
	            var c = process.platform === 'win32' ?
	                        `set ${name}=${val} & ` :
	                        `${name}='${val}' `;

	            return cmd(str + c);
	        },

	        do: function (c) {
	            return cmd(str + pathStr + c);
	        },

	        run: function () {
	            return new Promise(function (resolve, reject) {
	                exec(str, function (err, stdout, stderr) {
	                    var ret = {
	                        stdout: stdout,
	                        stderr: stderr,
	                        error: err
	                    };

	                    (err && reject(ret)) || resolve(ret);
	                });
	            });
	        },

	        toString: function () {
	            return str;
	        }
	    };
	};
}