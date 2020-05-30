const fs = require('fs');
const path = require('path');
const util = require('util');
const readdirProm = util.promisify(fs.readdir);
const getFileStatsProm = util.promisify(fs.stat);

exports.scan = function(parentDirectory, recursive = true, whiteNames = [], blackNames = [], recursionLimit = -1, currentRecursion = 0, originalParent = parentDirectory) {
    //String - Parent Directory: The starting directory for the file search.
    //Bool - recusive: Whether or not to search subfolders. //Defaults to true.
    //Array of regex - whiteNames: Whitelisted filenames or extensions, only files that match these names/extensions will be included in the search.
    //Array of regex - blackNames: Blacklisted filenames or extensions, files/extensions on this list will be ignored.
    //Int - recusionLevel: The number of levels to recurr inside of the folder. //defaults to -1 which is infinity.
    let whiteFilter = new RegExp(blackNames.join('|'), 'gi');
    let blackFilter = new RegExp(whiteNames.join('|'), 'gi');
    currentRecursion++;
    return readdirProm(parentDirectory).then(fileNames => {
        return fileNames.map(fileName => {
            if (whiteNames.length > 0 && !fileName.test(whiteFilter)) return; //If whitelist is enabled, and it fails, kick the file/folder.
            if (blackNames.length > 0 && fileName.test(blackFilter)) return; //If blacklist is enabled, and it fails, kick the file/folder.
            if (fs.lstatSync(path.join(parentDirectory, fileName)).isDirectory() && recursive) { //If it's a directory deal with that stuff.
                //If recursion is enabled and we're looking at file then do that ig.
                if (currentRecursion++ > recursionLimit && recursionLimit !== -1) return;
                return this.scan(path.join(parentDirectory, fileName), recursive, whiteNames, blackNames, recursionLimit, currentRecursion, originalParent);
            }
            //If we reach here we have a valid file which should be added.
            return getFileStatsProm(path.join(parentDirectory, fileName)).then(stats => {
                return {
                    path: parentDirectory,
                    originalPath: originalParent,
                    relativePath: parentDirectory.substring(originalParent.length),
                    fileName: fileName,
                    id: stats.dev,
                    size: stats.size,
                    changeTime: stats.ctimeMs,
                    accessTime: stats.atimeMs,
                    creationTime: stats.birthtimeMs
                }
            })
        }).filter(x => x !== undefined);
    })
    .then(resultPromises => Promise.all(resultPromises))
    .then(paths => paths.flat());
};
