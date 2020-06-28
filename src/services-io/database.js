const sqlite3 = require('sqlite3').verbose();
const util = require('util');
const path = require('path');
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
    let dbRun = util.promisify(db.run.bind(db));
    this.tables = ['ListA_no_edit', 'ListA_edit', 'ListB_no_edit', 'ListB_edit', 'List_C'];
    db.configure("busyTimeout", 10000);
    this.createTables = () => util.promisify(db.exec.bind(db))(this.tables.reduce((prev, current) => prev + `CREATE TABLE IF NOT EXISTS \`${current}\` (id INTEGER PRIMARY KEY, path TEXT NOT NULL, originalPath TEXT NOT NULL, relativePath TEXT NOT NULL, fileName TEXT NOT NULL, renamed TEXT, extension TEXT, size INTEGER NOT NULL, changeTime INTEGER, accessTime INTEGER, creationTime INTERGER); \n`, '') + `CREATE TABLE IF NOT EXISTS config (placeHolder TEXT);`);
    this.clearTables = (table) => { //Clear the specified table(s).
        if (!table) table = this.tables; //If null then clear all tables.
        if (!Array.isArray(table)) table = [table]; //Ensure is array, even if only single id provided.
        return dbRun(table.reduce((prev, current) => prev + `delete from ${current}; `, ''));
    }
    this.addFile = (fileObj, table) => dbRun(`INSERT INTO ${table} VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [fileObj.id, fileObj.path, fileObj.originalPath, fileObj.relativePath, fileObj.fileName, fileObj.renamed, fileObj.extension, fileObj.size, fileObj.changeTime, fileObj.accessTime, fileObj.creationTime]);
    this.getItems = (table, itemCount, offset) => util.promisify(db.all.bind(db))(`SELECT * FROM ${table}${(itemCount) ? ' LIMIT ' + itemCount : ''}${(offset) ? ' OFFSET ' + offset : ''}`); //Get first x items from table
    this.getInfo = (table) => util.promisify(db.get.bind(db))(`SELECT SUM(size) as sizeSum, COUNT(*) as count FROM ${table}`); //Get info (size and count) of specified table.
    this.close = () => db.close();
    return this;
}


exports.Database = Database;