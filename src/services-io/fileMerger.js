const fs = require("fs");
const path = require("path");
const util = require("util");
const copyFileProm = util.promisify(fs.copyFile);
const dirCheck = require("./dirChecker.js");

//Takes a list of files from input dirs, and then copies them to an output directory.
function mergeFiles(fileList = [], outputDir = "") {
  if (typeof outputDir !== "string" || outputDir.length < 10)
    return Promise.resolve(); //If not string or path less than 10 char, then return.
  return Promise.all(
    fileList.map(file =>
      dirCheck.check(path.join(outputDir, file.relativePath))
    )
  ).then(() => {
    //Check that the full directory structure has been created.
    return fileList.map(file =>
      copyFileProm(
        path.join(file.path, file.fileName),
        path.join(
          outputDir,
          file.relativePath,
          file.renamed.length > 0 ? file.renamed : file.fileName
        )
      )
        .then(() => {
          //Copy each file.
          // console.log(
          //   `File: ${file.fileName} copied from ${file.path} to ${outputDir} succesfully.`
          // );
        })
        .catch(err => {
          console.log(
            `\n\n${err}\nFile: ${JSON.stringify(
              file,
              2,
              null
            )}\nOutput file: ${path.join(
              outputDir,
              file.relativePath,
              file.renamed.length > 0 ? file.renamed : file.fileName
            )}`
          );
          throw err;
        })
    );
  });
}

//Function that takes files from a list and copies them to an output directory.
exports.merge = mergeFiles;
