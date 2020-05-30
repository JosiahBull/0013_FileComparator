const fs = require('fs');
const path = require('path');
const util = require('util');
const copyFileProm = util.promisify(fs.copyFile);
const mkDirProm = util.promisify(fs.mkdir);
let createdDirectories = [];

//Checks that a diretory exists, if it doesn't creates the required directory for the file.
function checkDir(dirPath) {
    if (!fs.existsSync(dirPath) && !createdDirectories.includes(dirPath)) { //Check that file exists and that it hasn't already been created by another thread.
        createdDirectories.push(dirPath); //Prevent recurrance of dir creation.
        console.log(`Dir does not exist. Creating dir: ${dirPath}`);
        return mkDirProm(dirPath, {recursive: true}).then(() => console.log('Finished creating dir.'));
    }
}
//Takes a list of files from input dirs, and then copies them to an output directory.
function mergeFiles(fileList = [], outputDir = '') {
    if (typeof outputDir !== 'string' || outputDir.length < 10) return Promise.resolve(); //If not string or path less than 10 char, then return.
    return Promise.all(fileList.map(file => checkDir(path.join(outputDir, file.relativePath)))).then(() => { //Check that the full directory structure has been created.
        return fileList.map(file => copyFileProm(path.join(file.path, file.fileName), path.join(outputDir, file.relativePath, file.fileName)).then(() => { //Copy each file.
            console.log(`File: ${file.fileName} copied from ${file.path} to ${outputDir} succesfully.`);
        }));
    });
};

//Function that takes files from a list and copies them to and output directory. 
exports.merge = mergeFiles;