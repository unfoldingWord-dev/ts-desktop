var {fileComparator} = require('./usfm');
var path = require('path');
var fs = require('fs-extra');

/**
 * Produces markdown for a project
 * @param projectPath
 * @returns {string}
 */
function generateProjectMarkdown(projectPath) {
    return '';
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
                if (path.basename(filepath) === 'front') {
                    // book title
                    usfm += '\n//\n' + fileData + '\n//';
                } else {
                    // chapter headers
                    usfm += '\n' + fileData;
                }
            } else if(files[i] === 'reference.txt') {
                // chapter reference
                usfm += '\n' + fileData;
            } else {
                // var image = '{{https://cdn.door43.org/obs/jpg/360px/obs-en-01-10.jpg}}';
                usfm += '\n' + fileData;
            }
        }
    }
    return usfm.replace(/(^\s|\s$)/, '');
}

module.exports.generateProjectMarkdown = generateProjectMarkdown;
