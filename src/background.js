"use strict";

import { app, protocol, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import {
	createProtocol
	/* installVueDevtools */
} from "vue-cli-plugin-electron-builder/lib";
const isDevelopment = process.env.NODE_ENV !== "production";
const fileIndexer = require('./services-io/fileIndexer.js');
const dirChecker = require('./services-io/dirChecker.js');
// const fileDeleter = require('./services-io/fileDeleter.js');
const fileMerger = require('./services-io/fileMerger.js');
const fileRanker = require('./services-io/fileRanker.js');

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
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
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
ipcMain.on('checkDirEmpty', (event, args) => {
	console.log('Checking dir');
	fileIndexer.scan(args.parentDirectory).then(result => {
		event.reply('dirChecked', {result: (result > 0), id: args.id})
	}).catch(err => {
		event.reply('unknownErr', err);
	})
});
//Takes parent directory (and other options) and returns a list of all files and paths in that dir.
ipcMain.on('scanDir', (event, args) => {
	console.log('Scanning dir');
	fileIndexer.scan(args.parentDirectory, args.recursive, args.whiteNames, args.blackNames, args.recursionLimit).then(result => {
		event.reply('dirScanned', {result: result, id: args.id});
	}).catch(err => {
		event.reply('unknownErr', err);
	})
});
//Takes two arrays of files and copies them from their original locations to an output dir.
ipcMain.on('mergeDirs', (event, args) => {
	console.log('merging dir');
	fileMerger.merge(args.fileListA, args.fileListB, args.destPath).then(result => {
		event.reply('filesMerged', true) //Responds with a true bool if succesfully merged.
	}).catch(err => {
		event.reply('unknownErr', err);
	})
});
//Takes two arrays of files and ranks them, merging them into one list. Depending on compare settings some files may be removed or renamed.
//Also takes a 'rename or remove' bool. When true files will be renamed and need a rename setting object, otherwise needs a ranking object for settings.
ipcMain.on('rank', (event, args) => {
	console.log('ranking dir');
	let rankedFiles;
	try {
		if (args.rename) {
			//Rename files and keep all.
			rankedFiles = fileRanker.renameMerge(args.fileListA, args.fileListB, args.settings); //Settings is expected to be a string for sorting. I.e. 'title', 'date' or 'num'.
		} else {
			//Merge files with ranking info.
			rankedFiles = fileRanker.compareFiles(args.fileListA, args.fileListB, args.settings); //Expects a sorting object. I.e. [['changeTime', true], ['size', true]] The bool being true means sort in ascending order.
		}
		rankedFiles.id = args.id;
		event.reply('filesRanked', rankedFiles);
	} catch (err) {
		event.reply('unknownErr', err);
	}
});

//Opens search dialog.
ipcMain.on('selectDir', (event, args) => {
	console.log('Selecting dir');
	dialog.showOpenDialog({
		title: args.title,
		filters: [],
		properties: ['openDirectory', 'showHiddenFiles']
	}).then(result => {
		result.id = args.id;
		result.id = args.id;
		event.reply('dirSelected', result);
	}).catch(err => {
		event.reply('unknownErr', err);
	})
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