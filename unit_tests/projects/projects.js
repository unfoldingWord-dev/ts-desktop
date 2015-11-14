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

    	// Doesn't matter what this is right now.
    	let trans = {
			blah: 'something here'
		};

		// This is the bare minimum for the meta object.
		let meta = {
			language: {
				lc: 'en'
			},
			project: {
				code: 'gen'
			}
		};

		let expectedDir = 'uw-gen-en',
		    projectDir = path.join(targetDir, expectedDir);

    	before(function (done) {
    		rimraf(targetDir, function (error) {
    			if (error) done(error);

    			pm.saveTargetTranslation(trans, meta).then(done).catch(done);
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

	        it('should create a manifest and translation file', function (done) {
				fs.readdir(projectDir, function (err, files) {
					if (err) done(err);

					assert.deepEqual(files, ['manifest.json', 'translation.json']);
					done();
				});
	        });

	        it('should have the right manifest content', function (done) {
	        	fs.readFile(path.join(projectDir, 'manifest.json'), function (err, contents) {
	        		if (err) done(err);

					let manifest;

					try {
						manifest = JSON.parse(contents);
					} catch (e) {
						assert.fail('Bad JSON', meta, 'manifest should equal meta');
						done();
					}

					assert.deepEqual(manifest, meta, 'manifest should equal meta');
					done();
				});
	        });

	        it('should have the right translation content', function (done) {
	        	fs.readFile(path.join(projectDir, 'translation.json'), function (err, contents) {
	        		if (err) done(err);

					let translation;

					try {
						translation = JSON.parse(contents);
					} catch (e) {
						assert.fail('Bad JSON', trans, 'translation should equal passed in value');
						done();
					}

					assert.deepEqual(translation, trans, 'translation should equal passed in value');
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
					.then(function (list) { return list[0]; })
					.then(pm.loadTargetTranslation)
					.then(function (translation) {
						assert.deepEqual(translation, trans);
						done();
					}).catch(done);
			});
		});

		describe('@deleteTargetTranslation', function () {
			it('should delete the project folder', function (done) {

				// Doesn't matter what this is right now.
		    	let _trans = {
					blahblahblah: 'something here'
				};

				// This is the bare minimum for the meta object.
				let _meta = {
					language: {
						lc: 'fr'
					},
					project: {
						code: 'exo'
					}
				};

				let _expectedDir = 'uw-exo-fr';

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
