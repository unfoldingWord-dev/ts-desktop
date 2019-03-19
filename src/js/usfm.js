var path = require('path');
var fs = require('fs-extra');

/**
 * Produces USFM from a project
 * @param projectPath
 * @return {string}
 */
function generateProjectUSFM(projectPath) {
    var srcDir = path.join(projectPath, '.apps/translationStudio');
    var usfm = concatFiles(srcDir);

    usfm = usfm.replace(/(\\v\s+)/g, '\n$1');

    return usfm;
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
    if(aIsTitle) return -1;
    if(bIsTitle) return 1;

    // compare numbers
    try {
        var diff = parseInt(path.basename(b, '.txt')) - parseInt(path.basename(a, '.txt'));
        if(diff > 0) {
            return -1;
        } else if (diff < 0) {
            return 1;
        }
    } catch (e) {
        console.error('Unexpected value. Cannot compare "' + a + '" with "' + b + '"' , e);
    }
    return 0 ;
}

/**
 * walks over every folder/file in the directory and
 * concatenates all the files
 * @param filepath
 * @returns {string}
 */
function concatFiles(filepath) {
    var usfm = '';
    var files = fs.readdirSync(filepath);
    files.sort(fileComparator);
    for (var i = 0, len = files.length; i < len; i++) {
        var itemPath = path.join(filepath, files[i]);
        if(isNaN(path.basename(files[i], '.txt')) && ['front', 'back', 'title.txt', 'reference.txt'].indexOf(files[i]) === -1) {
            continue;
        }
        if(fs.statSync(itemPath).isDirectory()) {
            usfm += '\n' + concatFiles(itemPath).replace(/(^\s|\s$)/, '');
        } else {
            var fileData = fs.readFileSync(itemPath).toString().replace(/(^\s|\s$)/, '');
            if(files[i] === 'title.txt') {
                if(path.basename(filepath) === 'front') {
                    // book title
                    usfm  += '\n\\h ' + fileData;
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
