const fs = require('fs');
const util = require('util');
const mkDirProm = util.promisify(fs.mkdir);
let createdDirectories = [];

//Checks that a diretory exists, if it doesn't creates the required directory for the file.
function checkDir(dirPath) {
    if (!fs.existsSync(dirPath) && !createdDirectories.includes(dirPath)) { //Check that file exists and that it hasn't already been created by another thread.
        createdDirectories.push(dirPath); //Prevent recurrance of dir creation.
        console.log(`Dir does not exist. Creating dir: ${dirPath}`);
        return mkDirProm(dirPath, {recursive: true}).catch((err) => {console.log(`Error when creating dir: ${dirPath}`); throw err});
    }
}

exports.check = checkDir;