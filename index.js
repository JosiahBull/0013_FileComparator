const fileIndexer = require('./fileIndexer');
const fileRanker = require('./fileRanker');
const fileMerger = require('./fileMerger');


let filesOne = fileIndexer.scan("W:\\OneDrive\\Apps\\0013_FileComparator\\TestFiles\\FolderOne");
let filesTwo = fileIndexer.scan("W:\\OneDrive\\Apps\\0013_FileComparator\\TestFiles\\FolderTwo");

Promise.all([filesOne, filesTwo]).then(result => {
    let rankedFiles = fileRanker.compareFiles(result[0], result[1], [['changeTime', true], ['size', true]]);
    fileMerger.merge(rankedFiles, "W:\\OneDrive\\Apps\\0013_FileComparator\\TestFiles\\There\\Are\\Many\\Layers\\To\\A path heyo");
});