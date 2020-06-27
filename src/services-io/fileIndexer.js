const fs = require("fs");
const path = require("path");
const util = require("util");
const readdirProm = util.promisify(fs.readdir);
const getFileStatsProm = util.promisify(fs.stat);
const dirCheck = require("./dirChecker.js");

let d = new Date();
let counter = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();

function Batch(directory, recursive, whiteNames, blackNames, recursionLimit, currentRecursion, topParent, notifyCompletion, addQueue, err, dbPushFunc, dbId){
	this.directory = directory;
	this.dbPushFunc = dbPushFunc;
	this.dbId = dbId;
	this.recursive = recursive;
	this.whiteNames = whiteNames;
	this.blackNames = blackNames;
	this.whiteFilter = new RegExp(this.blackNames.join('|'), 'gi');
	this.blackFilter = new RegExp(this.whiteNames.join('|'), 'gi');
	this.recursionLimit = recursionLimit;
	this.currentRecursion = currentRecursion++;
	this.topParent = topParent;
	this.addQueue = addQueue;
	this.notifyCompletion = notifyCompletion;
	this.err = err;
	this.process = () => {
		return readdirProm(this.directory).then(fileNames => {
			return fileNames.map(fileName => {
				if (this.whiteNames.length > 0 && !fileName.test(this.whiteFilter)) return; //If whitelist is enabled and it fails, ignore the file/folder that we found.
				if (this.blackNames.length > 0  && fileName.test(this.blackFilter)) return; //If blacklist is enabled and it fails, ignore the file/folder.
				if (fs.lstatSync(path.join(this.directory, fileName)).isDirectory() && this.recursive) {
					//If dir then add an item to be scanned.
					if (recursionLimit++ >= recursionLimit && recursionLimit !== -1) return; //If we are approaching the recursion limit then don't continue to recurse.
					this.addQueue(path.join(this.directory, fileName), this.recursive, this.whiteNames, this.blackNames, this.recursionLimit, this.currentRecursion, this.topParent, this.notifyCompletion, this.addQueue, this.err, this.dbPushFunc, this.dbId);
					return; //Done with this item.
				};
				//If we get to here we have a valid file that has been scanned.
				return getFileStatsProm(path.join(this.directory, fileName)).then(stats => {
					let fileObj = {
						path: this.directory,
						originalPath: this.topParent,
						relativePath: this.directory.substring(this.topParent.length),
						fileName: fileName,
						renamed: "",
						extension: path.extname(fileName),
						id: counter++,
						size: stats.size,
						changeTime: stats.ctimeMs,
						accessTime: stats.atimeMs,
						creationTime: stats.birthtimeMs
					};
					this.dbPushFunc(fileObj, this.dbId);
					return fileObj;
				});
			})//.filter(x => x !== undefined); //Remove directory entries that got nuked.
		}).then(promises => Promise.all(promises)) //Resolve them before spitting out a result.
		.then(() => {
			// this.result = result;
			this.notifyCompletion(this);
		}).catch(err => {
			this.err(err);
		});
	};
	return this;
}

function scan(parentDirectory, recursive = true, whiteNames = [], blackNames = [], recursionLimit = -1, dbPushFunc = function(){}, dbId = function(){}) {
	let currentRecursion = -1;
	return new Promise((res, rej) => {
		let queue = [];
		// let resultFile = [];
		let maxConcurrentScanners = 100; //Arbitrary limit.
		let currentScanners = 0;
		let scannedCount = 0;
		let processFromQueue = () => {
			if (queue.length === 0 && currentScanners === 0) {
				//Processing finished.
				res();
			}
			queue = queue.filter(batch => {
				if (currentScanners < maxConcurrentScanners) {
					batch.process();
					currentScanners++;
					return false;
				}
				return true;
			});
		}
		let notifyCompletion = (batch) => {
			// if (batch.result.length > 0) {
			// 	resultFile = [...resultFile, ...batch.result];
			// }
			currentScanners--;
			scannedCount++;
			processFromQueue();
		}
		let addQueue = (directory, recursive, whiteNames, blackNames, recursionLimit, currentRecursion, topParent, notifyCompletion, addQueue, err, dbPushFunc, dbId) => {
			let batch = new Batch(directory, recursive, whiteNames, blackNames, recursionLimit, currentRecursion, topParent, notifyCompletion, addQueue, err, dbPushFunc, dbId);
			queue.push(batch);
			processFromQueue();
		}
		//String - Parent Directory: The starting directory for the file search.
		//Bool - recusive: Whether or not to search subfolders. //Defaults to true.
		//Array of regex - whiteNames: Whitelisted filenames or extensions, only files that match these names/extensions will be included in the search.
		//Array of regex - blackNames: Blacklisted filenames or extensions, files/extensions on this list will be ignored.
		//Int - recusionLevel: The number of levels to recurr inside of the folder. //defaults to -1 which is infinity.
		dirCheck.check(parentDirectory); //Check if dir exists, and if not then create it.
		//Start scan
		addQueue(parentDirectory, recursive, whiteNames, blackNames, recursionLimit, currentRecursion, parentDirectory, notifyCompletion, addQueue, rej, dbPushFunc, dbId);
	});
};

exports.scan = scan;