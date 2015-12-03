'use strict';

let assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	_ = require('lodash'),
	rimraf = require('rimraf'),
	ProjectsManager = require('../../app/js/projects').ProjectsManager;

let targetDir = path.resolve('./unit_tests/projects/data');

let config = {
	getValue: function (k) {
		let i = {
			'targetTranslationsDir': targetDir
		};
		return i[k];
	}
};

let query = function () { return []; };

let pm = new ProjectsManager(query, config);

describe('@Projects', function () {

    describe('@targetTranslation', function () {

    	// TODO: have some dummy chunks/frames, and test those scenarios.
    	let trans = [];

		// This is the bare minimum for the meta object.
		let meta = {
			language: {
				lc: 'en'
			},
			project: {
				slug: 'unittest'
			}
		};

		let expectedDir = 'uw-unittest-en',
		    projectDir = path.join(targetDir, expectedDir);

    	before(function (done) {
    		rimraf(targetDir, function (error) {
    			if (error) done(error);

    			pm.saveTargetTranslation(trans, meta).then(function () {
    				done();
    			}).catch(function (err) {
    				done(new Error(err.stderr || err));
    			});
    		});
    	});

    	after(function (done) {
    		rimraf(targetDir, done);
    	});

    	describe('@saveTargetTranslation', function () {

	        it('should create a projects directory', function (done) {
	        	fs.readdir(targetDir, function (err, files) {
	        		if (err) done(err);

	    			assert.deepEqual(files, [expectedDir]);
	    			done();
	    		});
	        });

	        it('should create a manifest and project file', function (done) {
				fs.readdir(projectDir, function (err, files) {
					if (err) done(err);

					assert(_.includes(files, 'manifest.json'), 'expected manifest file');
					assert(_.includes(files, 'project.json'), 'expected project file');
					done();
				});
	        });

	        it('should have the right project meta content', function (done) {
	        	fs.readFile(path.join(projectDir, 'project.json'), function (err, contents) {
	        		if (err) done(err);

					let project;

					try {
						project = JSON.parse(contents);
					} catch (e) {
						assert.fail('Bad JSON', project);
						done();
					}

					assert.deepEqual(project, meta, 'project meta should equal meta');
					done();
				});
	        });

	    });

		describe('@loadProjectsList', function () {
			it('should have one project in the list', function (done) {
				pm.loadProjectsList().then(function (list) {
					assert.deepEqual(list, [expectedDir]);
					done();
				}).catch(done);
			});
		});

		describe('@loadTargetTranslationsList', function () {
			it('should load the meta object', function (done) {
				pm.loadTargetTranslationsList().then(function (list) {
					assert.equal(list.length, 1, 'there should only one target translation');
					assert.deepEqual(list[0], meta, 'this needs to be the meta object');
					done();
				}).catch(done);
			});
		});

		describe('@loadTargetTranslation', function () {
			it('should load the translation object', function (done) {
				pm.loadTargetTranslationsList()
					.then(_.first)
					.then(pm.loadTargetTranslation.bind(pm))
					.then(function (translation) {
						assert.deepEqual(translation, trans);
						done();
					}).catch(done);
			});
		});

		describe('@deleteTargetTranslation', function () {
			it('should delete the project folder', function (done) {

		    	let _trans = [];

				// This is the bare minimum for the meta object.
				let _meta = {
					language: {
						lc: 'fr'
					},
					project: {
						code: 'unittest'
					}
				};

				let _expectedDir = 'uw-unittest-fr';

				pm.saveTargetTranslation(_trans, _meta).then(function () {
					return pm.deleteTargetTranslation(_meta);
				}).then(function () {
					return pm.loadProjectsList();
				}).then(function (list) {
					let r = _.intersection(list, [_expectedDir]);
					assert.equal(r.length, 0, 'project folder should no longer exist');
					done();
				}).catch(done);
			});
		});
    });

});
