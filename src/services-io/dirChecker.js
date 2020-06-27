const fs = require("fs");
const util = require("util");
const mkDirProm = util.promisify(fs.mkdir);
let createdDirectories = [];

//Checks that a diretory exists. Can create the directory if the create flag is set.
function checkDir(dirPath, create = true) {
  //Returns true/false bool, if create flag is true will create the dir.
  if (!fs.existsSync(dirPath) && !createdDirectories.includes(dirPath)) {
    //Check that file exists and that it hasn't already been created by another thread.
    //File does not exist.
    if (!create) return false;
    createdDirectories.push(dirPath); //Prevent recurrance of dir creation from instance.
    console.log(`Dir does not exist. Creating dir: ${JSON.stringify(dirPath)}`);
    return mkDirProm(dirPath, { recursive: true })
      .then(() => true)
      .catch(err => {
        console.log(`Error when creating dir: ${dirPath}`);
        throw err;
      }); //After creation returns true.
  }
  return true; //File exists.
}

exports.check = checkDir;
