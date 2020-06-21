const sqlite3 = require('sqlite3').verbose();
//The goal of this file is to create and manage a databse of files for the program to scan and edit.
//We are going to want to hold six tables.
//Table 1 - List of files in directory one (uneditted)
//Table 2 - List of remaining files in directory one after passing through the filter (both white/black lists, but also the merge filter);
//Table 3 - List of files in directory Two (uneditted)
//Table 4 - List of remaining files in directory two after passing through the filter (note: should display any renaming that may have occured.).
//Table 5 - Output list after passing through all filters from both lists (will rename files if required);
//Table 6 - General settings that may have been set/required by the program

//We need to be able to clear, add, remove, and update from all of these tables as required.
//We should use the fileIDs from windows as our primary key (I mean why not right? Someone else has already done that work lets piggy back).

function Database() {
    let db = new sqlite3.Database('./src/services-io/db/fileStore.db');
    this.currentAccessId = '';
    this.checkTables = () => { //Check that tables exist.

    }

    this.createTables = () => { //Create the tables.
        return new Promise((res, rej) => {
            let count = 0;
            function checkCount() {
                if (count === 6) res();
            }
            let tables = ['ListA_no_edit', 'ListA_edit', 'ListB_no_edit', 'ListB_edit', 'List_C'];
            tables.forEach(table => {
                db.run(`CREATE TABLE IF NOT EXISTS ${table} (
                    id INTEGER PRIMARY KEY,
                    path TEXT NOT NULL,
                    originalPath TEXT NOT NULL,
                    relativePath TEXT NOT NULL,
                    fileName TEXT NOT NULL,
                    renamed TEXT,
                    extension TEXT,
                    size INTEGER NOT NULL,
                    changeTime INTEGER,
                    accessTime INTEGER,
                    creationTime INTERGER
                );`, [], (err) => {
                    if (err) rej(err);
                    count++;
                    checkCount();
                });
            });
            db.run(`CREATE TABLE IF NOT EXISTS config (
                placeHolder TEXT
            );`, [], (err) => {
                if (err) rej(err);
                count++;
                checkCount();
            })
        })
    }
    
    this.clearTables = (table) => { //Clear the specified table.

    }

    this.addFile = (fileObj, tableId) => {
        let table = (tableId) ? tableId : this.currentAccessId;
        //Note: NO checks are being carried out on the validity of the file.
        return new Promise((res, rej) => {
            db.run(`INSERT INTO ${table} VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [fileObj.id, fileObj.path, fileObj.originalPath, fileObj.relativePath, fileObj.fileName, fileObj.renamed, fileObj.extension, fileObj.size, fileObj.changeTime, fileObj.accessTime, fileObj.creationTime], (err) => {
                if (err) rej(err);
                res();
            })
        });
    }

    this.get = (table) => {
        //Get vals from specified table.

    }

    this.close = () => {
        db.close();
    }
    return this;
}


exports.Database = Database;