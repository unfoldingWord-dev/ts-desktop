// git module

'use strict';

var path = require('path'),
	fs = require('fs'),
	exec = require('child_process').exec;

function Git() {

	function cmd(s) {
		var str = s || '';

		return {
			cd: function (dir) {
				return cmd(str + 'cd "' + dir + '"');
			},

			get and () {
				return cmd(str + ' && ');
			},

			get then () {
				return cmd(str + '; ');
			},

			get or () {
				return cmd(str + ' || ');
			},

			do: function (c) {
				return cmd(str + c);
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
	}

	function readdir(dir) {
		return new Promise(function (resolve, reject) {
			fs.readdir(dir, function (err, files) {
				(err && reject(err)) || resolve(files);
			});
		});
	}

	function logr(msg) {
		return function (data) {
			console.log(msg, data);
			return data;
		};
	}

	return {

		// Initialize folder as git repository if it's not one already
		init: function(dir) {
			return readdir(dir).then(function (files) {
				var init = cmd().cd(dir).and.do('git init'),
					hasGitFolder = (files.indexOf('.git') >= 0);

				return !hasGitFolder && init.run();
			}).then(logr('Git is initialized'));
		},

		// Add and commit all changed files with the given message
		stage: function(dir) {
			var msg = new Date(),
				stage = cmd().cd(dir)
					.and.do('git add --all')
					.and.do('git commit -am "' + msg + '"');

			return stage.run().then(logr('Files are staged'));
		},

		// Push staged files to remote repo
		push: function(dir, repo, reg) {
            var ssh = 'ssh -i "' + reg.paths.privateKeyPath + '" -o "StrictHostKeyChecking no"',
            	gitSshPush = "set GIT_SSH_COMMAND=" + ssh + " & git push -u ssh://gitolite3@test.door43.org:9299/tS/" + reg.deviceId + "/" + repo + " master",
            	push = cmd().cd(dir).and.do(gitSshPush);

            console.log('Starting push to server...\n' + push);

            return push.run().then(logr('Files are pushed'));
		}
	};
}

module.exports.Git = Git;
