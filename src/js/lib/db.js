'use strict';

let path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    SQL = require('sql.js');

function Db (schemaPath, dbPath) {

    let dbFilePath = dbPath,
        dbDirPath = path.dirname(dbFilePath),
        sql;

    function saveDB (sql) {
        let data = sql.export();
        let buffer = new Buffer(data);

        mkdirp.sync(dbDirPath, '0755');
        fs.writeFileSync(dbFilePath, buffer);
    }

    if (!fs.existsSync(dbFilePath)) {
        let schema = fs.readFileSync(schemaPath);

        sql = new SQL.Database();
        sql.exec(schema);

        saveDB(sql);
    } else {
        let buffer = fs.readFileSync(dbFilePath);

        sql = new SQL.Database(buffer);
    }

    return {query: sql.exec.bind(sql), save: saveDB.bind(null, sql)};
}

module.exports.Db = Db;
