var path = require('path');
var fs = require('fs-extra');

/**
 * Produces USFM from a project
 * @param projectPath
 * @return {string}
 */
function generateProjectUSFM(projectPath) {
    var manifest = JSON.parse(
        fs.readFileSync(path.join(projectPath, 'manifest.json')));
    var usfm = concatFiles(projectPath, manifest);

    usfm = usfm.replace(/(\\v\s+)/g, '\n$1');

    return usfm;
}

/**
 * Converts usfm3 to usfm2
 * @param usfm3
 * @returns {*}
 */
function usfm3ToUsfm2(usfm3) {
    /** milestones */
    let usfm2 = usfm3.replace(/\n?\\zaln-s.*\n?/mg, '');
    usfm2 = usfm2.replace(/\n?\\zaln-e\\\*\n?/mg, '');

    usfm2 = usfm2.replace(/\n?\\ks-s.*\n?/mg, '');
    usfm2 = usfm2.replace(/\n?\\ks-e\\\*\n?/mg, '');

    /** word data */
    // remove empty word markers
    usfm2 = usfm2.replace(/\\w\s*(\|[^\\]*)?\\w\*/g, '');
    // place words on their own lines so regex doesn't break
    usfm2 = usfm2.replace(/(\\w\s+)/g, '\n$1');
    // remove words
    usfm2 = usfm2.replace(/\\w\s+([^|\\]*).*\\w\*/g, '$1');
    // group words onto single line
    usfm2 = usfm2.replace(/(\n+)([^\\\n +])/g, ' $2');
    // stick text without markup on previous line
    usfm2 = usfm2.replace(/\n^(?![\\])(.*)/mg, ' $1');

    /** whitespace */
    usfm2 = usfm2.replace(/^[ \t]*/mg, '');
    usfm2 = usfm2.replace(/[ \t]*$/mg, '');
    usfm2 = usfm2.replace(/^\n{2,}/mg, '\n\n');
    usfm2 = usfm2.replace(/ {2,}/g, ' ');
    usfm2 = usfm2.replace(/\n*(\\s5)\s*/mg, '\n\n$1\n');

    return usfm2;
}

/**
 * Compares two file names to determine sort order
 * @param a
 * @param b
 * @returns {number}
 */
function fileComparator(a, b) {
    // front and back data
    var aIsFront = a === 'front';
    var bIsFront = b === 'front';
    var aIsBack = a === 'back';
    var bIsBack = b === 'back';

    // chapter sections
    var aIsTitle = path.basename(a, '.txt').startsWith('title');
    var bIsTitle = path.basename(b, '.txt').startsWith('title');

    // compare book data
    if (aIsFront) return -1;
    if (bIsFront) return 1;
    if (aIsBack) return 1;
    if (bIsBack) return -1;

    // compare chapter sections
    if (aIsTitle) return -1;
    if (bIsTitle) return 1;

    // compare numbers
    try {
        var diff = parseInt(path.basename(b, '.txt')) -
            parseInt(path.basename(a, '.txt'));
        if (diff > 0) {
            return -1;
        } else if (diff < 0) {
            return 1;
        }
    } catch (e) {
        console.error(
            'Unexpected value. Cannot compare "' + a + '" with "' + b + '"', e);
    }
    return 0;
}

/**
 * walks over every folder/file in the directory and
 * concatenates all the files
 * @param filepath
 * @returns {string}
 */
function concatFiles(filepath, manifest) {
    var usfm = '';
    var files = fs.readdirSync(filepath);
    files.sort(fileComparator);
    for (var i = 0, len = files.length; i < len; i++) {
        var itemPath = path.join(filepath, files[i]);
        if (isNaN(path.basename(files[i], '.txt')) &&
            ['front', 'back', 'title.txt', 'reference.txt'].indexOf(
                files[i]) === -1) {
            continue;
        }
        if (fs.statSync(itemPath).isDirectory()) {
            usfm += '\n' +
                concatFiles(itemPath, manifest).replace(/(^\s|\s$)/, '');
        } else {
            var fileData = fs.readFileSync(itemPath).
                toString().
                replace(/(^\s|\s$)/, '');
            if (files[i] === 'title.txt') {
                if (path.basename(filepath) === 'front') {
                    // book title
                    usfm += '\n\\id ' + manifest.project.id + ' ' + fileData;
                    usfm += '\n\\ide usfm';
                    usfm += '\n\\h ' + fileData;
                    usfm += '\n\\toc1 ' + fileData;
                    usfm += '\n\\toc2 ' + fileData;
                    usfm += '\n\\toc3 ' + manifest.project.id;
                    usfm += '\n\\mt ' + fileData;
                } else {
                    // chapter headers
                    usfm += '\n\\s1 ' + fileData;
                }
            } else {
                usfm += '\n' + fileData;
            }
        }
    }
    return usfm.replace(/(^\s|\s$)/, '');
}

module.exports.generateProjectUSFM = generateProjectUSFM;
module.exports.fileComparator = fileComparator;
module.exports.usfm3ToUsfm2 = usfm3ToUsfm2;
