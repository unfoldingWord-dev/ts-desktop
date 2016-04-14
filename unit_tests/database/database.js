'use strict';

process.env.NODE_ENV = 'test';
let path = require('path');
let assert = require('assert');
let DataManager = require('../../src/js/database').DataManager;
let Db = require('../../src/js/lib/db').Db;
let dataManager = (function () {
    var srcDir = path.resolve(path.join(__dirname, '../../src')),
        schemaPath = path.join(srcDir, 'config', 'schema.sql'),
        dbPath = path.join(srcDir, 'index', 'index.sqlite'),
        db = new Db(schemaPath, dbPath);

    return new DataManager(db);
})();

describe('@Database', function () {
	this.timeout(6000);

	describe('@GetChunkMarkers', function() {
        it('should return an array of chunk markers for the project', function(done) {
            let markers = dataManager.getChunkMarkers('gen');
            assert(markers.length > 0);
			done();
        });
		it('should return an empty array of chunk markers for unknown project', function(done) {
			let markers = dataManager.getChunkMarkers('missing-project');
			assert(markers.length === 0);
			done();
		});
    });
});
