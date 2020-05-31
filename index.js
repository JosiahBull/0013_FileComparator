const fileIndexer = require('./fileIndexer');
const fileRanker = require('./fileRanker');
const fileMerger = require('./fileMerger');


let filesOne = fileIndexer.scan("W:\\OneDrive\\Apps\\0013_FileComparator\\TestFiles\\DuplicateTest\\First");
let filesTwo = fileIndexer.scan("W:\\OneDrive\\Apps\\0013_FileComparator\\TestFiles\\First");
let outputDir = "W:\\OneDrive\\Apps\\0013_FileComparator\\TestFiles\\DuplicateTest\\Result";
let outputDirScanned = fileIndexer.scan(outputDir);

Promise.all([filesOne, filesTwo, outputDirScanned]).then(result => {
    if (result[2].length > 0) {
        console.log('WARING: Output directory already contains files. This can result in merge errors, it is recommended to merge your directories into a single new empty directory.');
        return;
    }
    // let rankedFiles = fileRanker.compareFiles(result[0], result[1], [['changeTime', true], ['size', true]]);
    let rankedFiles = fileRanker.renameMerge(result[0], result[1], 'title');
    
    fileMerger.merge(rankedFiles, outputDir)
    .catch(err => {
        console.log(err)
    })
});

//NB The output directory should be empty before attempting to copy.