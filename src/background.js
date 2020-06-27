"use strict";

import { app, protocol, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import {
  createProtocol
  /* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";
const isDevelopment = process.env.NODE_ENV !== "production";
const fileIndexer = require("./services-io/fileIndexer.js");
const dirChecker = require("./services-io/dirChecker.js");
// const fileDeleter = require('./services-io/fileDeleter.js');
const fileMerger = require("./services-io/fileMerger.js");
const fileRanker = require("./services-io/fileRanker.js");
const database = require('./services-io/database.js').Database();
const path = require("path");

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

//Takes args.checkPath, and returns a true/false bool on whether the directory is empty.
ipcMain.on("checkDirEmpty", (event, args) => {
  console.log("Checking dir");
  fileIndexer
    .scan(args.parentDirectory)
    .then(result => {
      event.reply("dirChecked", { result: result > 0, id: args.id });
    })
    .catch(err => {
      event.reply("unknownErr", err);
    });
});
ipcMain.on('getFiles', (event, args) => { //Get files from database
	//Args: id, dbID, start index, num items to collect.
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
  fileIndexer
	.scan(args.parentDirectory, args.recursive, args.whiteNames, args.blackNames, args.recursionLimit, database.addFile, args.dbID)
	.then(() => {
		//Previous function loaded results into db. We are now going to request the first 100 items from the db and send them to the ui.
		databaseInfo = database.getInfo(args.dbID); //Get stats from db.
		databaseItems = database.getItems(args.dbID, 100); //Get first 100 items from db for list init.
		return Promise.all([databaseInfo, databaseItems]);
	})
    .then(result => {
	  event.reply("dirScanned", { size: result[0].sizeSum, count: result[0].count, result: result[1], id: args.id });
    })
    .catch(err => {
      event.reply("unknownErr", err);
      console.log("err");
      console.log(err);
    });
});
//Takes two arrays of files and copies them from their original locations to an output dir.
ipcMain.on("mergeDirs", (event, args) => {
  console.log("merging dir");
  fileMerger
    .merge(args.fileListA, args.fileListB, args.destPath)
    .then(result => {
      event.reply("filesMerged", true); //Responds with a true bool if succesfully merged.
    })
    .catch(err => {
      event.reply("unknownErr", err);
    });
});

//The merge button has been pressed. Broadcast back out in order to collect rank information.
ipcMain.on('mergeFiles', (event, args) => {
  console.log('Button pressed');
  event.reply('mergeFiles', (event, args));
});

//Takes two arrays of files and ranks them, merging them into one list. Depending on compare settings some files may be removed or renamed.
//Also takes a 'rename or remove' bool. When true files will be renamed and need a rename setting object, otherwise needs a ranking object for settings.
ipcMain.on('rankInfo', async (event, args) => {
  console.log('Ranking dirs')
	let { rename, renameSettings, ranks, path } = args;
  let rankedFiles;
  console.log(args);
	try {
    let listA = await database.getItems('ListA_no_edit'); //Get listA contents.
    let listB = await database.getItems('ListB_no_edit'); //Get listB contents.
		if (rename) {
			rankedFiles = fileRanker.renameMerge(listA, listB, renameSettings);
		} else {
			rankedFiles = fileRanker.compareFiles(listA, listB, ranks);
    }
    console.log(rankedFiles)
    await fileMerger
      .merge(rankedFiles, path)
      .then(res => {
        event.reply('filesMerged', {});
      });

	} catch (err) {
		event.reply('unknownErr', err);
		console.log(err);
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