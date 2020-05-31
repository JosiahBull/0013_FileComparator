const fs = require('fs');
const path = require('path');
const dirChecker = require('./dirChecker.js');

//Function which returns a promise which resolves to an object.
async function deleteFiles(filesToDelete = []) {
    if (!filesToDelete.isArray()) filesToDelete = [filesToDelete]; //Force it to be an array.
    console.log('Reminder: Deletion not currently completed due to liability.')
    return Promise.all(filesToDelete.map(file => {
        if (await dirChecker.check(path.join(file.parentDirectory, file.fileName), false)) { //Check dir exists before starting deletion.
            //Dir exists, delete.
            
        }
        return Promise.resolve([]);
    }))
}

async function deleteDir(dirPath) {
    if (typeof dirPath !== 'string') throw new Error('String not provided as path argument.');
    if (await dirChecker.check(dirPath, false)) {
        //Dir exists, delete.
        console.log('Reminder: Deletion not currently completed due to liability.')
    } 
    return Promise.resolve([]);
}

exports.delete = deleteFiles;
exports.deleteDir = deleteDir;

//TODO: Not sure if we want to open ourselves up to the liability of deleting files - will address at a later date. For now the functions are there and can be implemented into other code without having any effect.