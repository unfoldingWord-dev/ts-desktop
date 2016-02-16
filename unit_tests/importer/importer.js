'use strict';

process.env.NODE_ENV = 'test';

let fs = require('fs');
let path = require('path');
let Importer = require('../../app/js/importer').Importer;
let importer = new Importer();

describe('@Importer', function () {

    describe('@UsfmImport', function () {
        it('should import a sample ufsm file', function (done) {
            var file = {
                name: "sample-usfm-file.txt",
                path: path.resolve('unit_tests/importer/data/sample-usfm-file.txt')
            };
            importer.importUSFMFile(file).then(function(){
                done()
            }).catch(function(e){
                console.log(e.stack);
            });
        });

    });

    //cleanup
    after(function (done) {
        done();
    });

});
