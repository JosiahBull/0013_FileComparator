const path = require("path");

function compareArray(collision, compareSettings) {
  solved = false;
  compareSettings.forEach(comparisonStep => {
    if (solved) return;
    switch (comparisonStep[0]) {
      case "size":
        collision = collision.sort((a, b) => {
          if (a.size < b.size) return comparisonStep[1] ? 1 : -1;
          if (a.size > b.size) return comparisonStep[1] ? -1 : 1;
          return 0;
        });
        break;
      case "changeTime":
        collision = collision.sort((a, b) => {
          if (a.changeTime < b.changeTime) return comparisonStep[1] ? 1 : -1;
          if (a.changeTime > b.changeTime) return comparisonStep[1] ? -1 : 1;
          return 0;
        });
        break;
      case "creationTime":
        collision = collision.sort((a, b) => {
          if (a.creationTime < b.creationTime)
            return comparisonStep[1] ? 1 : -1;
          if (a.creationTime > b.creationTime)
            return comparisonStep[1] ? -1 : 1;
          return 0;
        });
        break;
      case "accessTime":
        collision = collision.sort((a, b) => {
          if (a.accessTime < b.accessTime) return comparisonStep[1] ? 1 : -1;
          if (a.accessTime > b.accessTime) return comparisonStep[1] ? -1 : 1;
          return 0;
        });
        break;
    }
  });
  return collision[0];
}

function renameArray(collision, renameSetting) {
  switch (renameSetting) {
    case "date": //Renames with current datetime.
      let currentDateTime = new Date();
      collision[1].renamed = `${collision[1].fileName.replace(
        /\.[^/.]+$/,
        ""
      )} - ${currentDateTime.getFullYear()}.${
        currentDateTime.getMonth() + 1 /* 0 indexed */
      }.${currentDateTime.getDate()}-${currentDateTime.getHours()}.${currentDateTime.getMinutes()}${path.extname(
        collision[1].fileName
      )}`;
      break;
    case "num": //Appends '(1)' to filename.
      collision[1].renamed = `${collision[1].fileName.replace(
        /\.[^/.]+$/,
        ""
      )} (1)${path.extname(collision[1].fileName)}`;
      break;
    case "title": //Appends name of merged parent folder to title. If both merge folders have the same name, appends a num to parent folder name.
      let titleOne = collision[0].originalPath.match(/([^\\\\]*)\\*$/)[1];
      let titleTwo = collision[1].originalPath.match(/([^\\\\]*)\\*$/)[1];
      if (titleOne === titleTwo) titleTwo = `${titleTwo} (1)`; //If they are the same add some variation.
      collision[0].renamed = `${collision[0].fileName.replace(
        /\.[^/.]+$/,
        ""
      )} - ${titleOne}${path.extname(collision[0].fileName)}`;
      collision[1].renamed = `${collision[1].fileName.replace(
        /\.[^/.]+$/,
        ""
      )} - ${titleTwo}${path.extname(collision[1].fileName)}`;
      break;
  }
  return collision;
}

function findCollisions(fileSetA, fileSetB) {
  let collisions = [];
  //Remove all files that don't share a common relative directory, filename, and extension. They will be unique files and are therefore not worth comparing as they do not have peers to compare to.
  fileSetA = fileSetA.filter(fileA => {
    let matchFound = false;
    fileSetB = fileSetB.filter(fileB => {
      if (matchFound) return true;
      //Only care about collisions.
      if (
        fileA.relativePath === fileB.relativePath &&
        fileA.fileName === fileB.fileName
      ) {
        matchFound = true;
        collisions.push([fileA, fileB]);
        return false;
      }
      return true;
    });
    return !matchFound;
  });
  return {
    collisions: collisions,
    unique: [...fileSetA, ...fileSetB]
  };
}

exports.compareFiles = function(
  fileSetA = [],
  fileSetB = [],
  compareSettings = []
) {
  //Compare takes two arrays of file information and a ranking system then compares them, returning a single array of the dominant files.
  //Expected compared settings [['size', true], ['date', false], ['name', true]]
  //True means Ascending order, i.e. A->Z
  let collisionChecked = findCollisions(fileSetA, fileSetB);
  collisionChecked.collisions.forEach(collision =>
    collisionChecked.unique.push(compareArray(collision, compareSettings))
  ); //Check each collision and then return the primary.
  return collisionChecked.unique;
};

exports.renameMerge = function(
  fileSetA = [],
  fileSetB = [],
  renameSetting = "num"
) {
  //Takes two arrays of file information, and renames files to ensure that all files reach the destination output file system.
  //By default takes a 'date' renaming approach. Can also numerically rename files ('num').
  let collisionChecked = findCollisions(fileSetA, fileSetB);
  collisionChecked.collisions.forEach(
    collision =>
      (collisionChecked.unique = [
        ...collisionChecked.unique,
        ...renameArray(collision, renameSetting)
      ])
  );
  return collisionChecked.unique;
};
