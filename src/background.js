"use strict";

import { app, protocol, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import {
  createProtocol
  /* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";
const isDevelopment = process.env.NODE_ENV !== "production";
// const fileDeleter = require('./services-io/fileDeleter.js');
const fileMerger = require("./services-io/fileMerger.js");
const fileRanker = require("./services-io/fileRanker.js");
const database = require('./services-io/database.js').Database();
const path = require("path");
const workerFarm = require('worker-farm');

const fileIndexer = workerFarm('C:\\Users\\Josiah Bull\\OneDrive\\Apps\\0013_FileComparator\\src\\services-io\\fileIndexer.js');

database.createTables()
.then(() => console.log('Database succesfully initialised.'))
.then(() => database.clearTables())
.then(() => console.log('Database succesfully cleared.'))
.catch(err => {
  console.log('Database error occured.')
  console.log(err)
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } }
]);

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    useContentSize: true,
    width: 1500,
    height: 800,
    title: "EndFile",
    icon: path.join(__dirname, "/assets/logo.ico"),
    minHeight: 600,
    minWidth: 1480,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }

  win.on("closed", () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    database.close();
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }
  }
  createWindow();
});

ipcMain.on('getFiles', (event, args) => { //Get files from database
  //Args: id, dbID, start index, num items to collect.
  console.log('Getting files')
	database.getItems(args.dbID, args.count, args.offset).then(res => {
		event.reply('filesCollected', {result: res, id: args.id})
	}).catch(err => {
		console.log(err);
		event.reply('unkownErr', err);
	})
});
ipcMain.on('writeFiles', (event, args) => { //write files to db.
	let files = args.files;
	if (!Array.isArray(files)) files = [files];
	Promise.resolve(files.map(file => {
		database.addFile(file, args.dbID)
	})).then(() => {
		event.reply('filesWritten', {id: args.id});
	}).catch(err => {
		console.log(err);
		console.reply('unknownErr', err);
	})
});
ipcMain.on('clearFiles', (event, args) => {
	//We're going to need the dbId and that shoudl be id.
	database.clearTables(args.dbID).then(() => {
		event.reply('tableCleared', {id: args.id})
	}).catch(err => {
		console.log(err);
		event.reply('unknownErr', err);
	})
});
//Takes parent directory (and other options) and returns a list of all files and paths in that dir.
ipcMain.on("scanDir", (event, args) => {
  	console.log("Scanning dir");
  	let databaseInfo, databaseItems;
  	database.clearTables(args.dbID);
	fileIndexer({
		parentDirectory: args.parentDirectory,
		recursive: args.recursive,
		whiteNames: args.whiteNames,
		blackNames: args.blackNames,
		recursionLimit: args.recursionLimit,
		dbId: args.dbID
	}, async (err, result) => {
		console.log('Successful scan.')
		if (err) {
			event.reply('unknownErr', err);
			return;
		};
		databaseInfo = await database.getInfo(args.dbID); //Get stats from db.
		databaseItems = await database.getItems(args.dbID, 100); //Get first 100 items from db for list init.
		console.log('Replying, yay.')
		event.reply('dirScanned', {
			size: databaseInfo.sizeSum,
			count: databaseInfo.count,
			result: databaseItems,
			id: args.id
		});
	});
});

let createMasterRegex = (regexArray = []) => new RegExp(regexArray.reduce((result, current) => result += `(${current.source})|`, '').slice(0, -1), 'gi');
function applyFilters(whiteNames, blackNames, list) {
	let blackRegex = createMasterRegex(blackNames);
	let whiteRegex = createMasterRegex(whiteNames);
	return list.filter(file => {
		if (file.fileName.match(blackRegex) && blackNames.length > 0) return false;
		if (!(file.fileName.match(whiteRegex)) && whiteNames.length > 0) return false;
		return true;
	})
}

//The merge button has been pressed. Broadcast back out in order to collect rank information.
ipcMain.on('mergeFiles', (event, args) => {
  console.log('Button pressed');
  event.reply('mergeFiles', (event, args));
});
//Collect Filters.
ipcMain.on('rankInfo', (event, args) => {
	console.log('Getting filter info.');
	filters = {};
	event.reply('getFilters', (event, args))
});
let filters = {};
//Takes two arrays of files and ranks them, merging them into one list. Depending on compare settings some files may be removed or renamed.
//Also takes a 'rename or remove' bool. When true files will be renamed and need a rename setting object, otherwise needs a ranking object for settings.
//Also gets the required filters.
ipcMain.on('filters', async (event, args) => {
	console.log('Filter arriving.');
	filters[args.id] = {
		blackNames: args.blackNames,
		whiteNames: args.whiteNames
	}
	if (Object.keys(filters).length === 2) { //Both filters have arrived.
		console.log('Ranking dirs')
		let { rename, renameSettings, ranks, path } = args;
		let rankedFiles;
		console.log(args);
		try {
		let listA = await database.getItems('ListA_no_edit').then(result => applyFilters(filters.ListA.whiteNames, filters.ListA.blackNames, result));
		let listB = await database.getItems('ListB_no_edit').then(result => applyFilters(filters.ListB.whiteNames, filters.ListB.blackNames, result));
		rankedFiles = (rename) ? fileRanker.renameMerge(listA, listB, renameSettings) : fileRanker.compareFiles(listA, listB, ranks);
		// console.log(rankedFiles)visua
		await fileMerger
			.merge(rankedFiles, path)
			.then(res => {
				event.reply('filesMerged', {});
			});
		} catch (err) {
			event.reply('unknownErr', err);
			console.log(err);
		}
	}
});


//Opens search dialog.
ipcMain.on("selectDir", (event, args) => {
  console.log("Selecting dir");
  dialog
    .showOpenDialog({
      title: args.title,
      filters: [],
      properties: ["openDirectory", "showHiddenFiles"]
    })
    .then(result => {
      result.id = args.id;
      event.reply("dirSelected", result);
    })
    .catch(err => {
      event.reply("unknownErr", err);
    });
});


// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

//TODO: Create a seperate process for carrying out I/O Operations and whatnot to avoid freezing the main process.
//TODO: Secure communication between processes. https://jaketrent.com/post/select-directory-in-electron/
//TODO: Adjust Split Points on Grid so that they break reasonably as the user scales the webpage.
//Consider using fast-glob to increase the speed of directory traversal: https://github.com/mrmlnc/fast-glob
//More relevant info: https://stackoverflow.com/questions/35769834/nodejs-scanning-a-directory-tree-is-slow-as-hell
//TODO: Consider using fs-extra to simplify things quite a lot: https://github.com/jprichardson/node-fs-extra#walk
//TODO use vuex for storage and processing of data & components.

//Make some sort of landing page.
//Output to file.
//properly rank files
//Fix ui scaling & breakpoints
//Add pagination
//Add search