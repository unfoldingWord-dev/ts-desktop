'use strict';

;(function () {

    let path = require('path');
    let fs = require('fs');
    let mkdirp = require('mkdirp');
    let SQL = require('sql.js');

    function Db (dbPath) {

        let needsDbSave = 0;
        let dbFilePath = path.resolve('./', path.join(dbPath, 'index.sqlite'));
        let dbDirPath = path.dirname(dbFilePath);
        let debug = 0;

        if (!fs.existsSync(dbFilePath)) {
            try {
                mkdirp.sync(dbDirPath, '0755');
            }
            catch (err) {
                console.log(err);
                return false;
            }
            let sql = new SQL.Database();
            let schema = fs.readFileSync('./config/schema.sql');
            sql.exec(schema);
            let data = sql.export();
            let buffer = new Buffer(data);
            fs.writeFileSync(dbFilePath, buffer);
        }
        let buffer = fs.readFileSync(dbFilePath);
        let sql = new SQL.Database(buffer);

        function parseWhere (query, values, whereLogic, whereValues) {
            if (typeof whereLogic !== 'undefined') {
                for (let i in whereValues) {
                    if (whereValues.hasOwnProperty(i)) {
                        whereLogic = whereLogic.replace(/\?/, ':whereParam' + i);
                        values[':whereParam' + i] = whereValues[i];
                    }
                }
                query += ' WHERE ' + whereLogic;
            }
            return query;
        }

        return {
            debug: function (on) {
                if (on === true || on === 1 || on === '1') {
                    debug = 1;
                } else {
                    debug = 0;
                }
            },
            select: function (table, fields, whereLogic, whereValues) {
                let fieldList = '';
                if (fields === '*') {
                    fieldList = fields;
                } else {
                    if (Array.isArray(fields)) {
                        fieldList = fields.join('`, `');
                    } else {
                        fieldList = fields;
                    }
                    fieldList = '`' + fieldList + '`';
                }
                let query = 'SELECT ' + fieldList + ' FROM `' + table + '`';
                let values = {};
                query = parseWhere(query, values, whereLogic, whereValues);
                if (debug === 1) {
                    console.log(query);
                    console.log(values);
                    console.log('---');
                }
                let statement = sql.prepare(query, values);
                let items = [];
                while (statement.step()) {
                    items.push(statement.get());
                }
                statement.free();
                if (items.length === 0) {
                    items = null;
                }
                return items;
            },
            selectRaw: function (query, values) {
                if (debug === 1) {
                    console.log(query);
                    console.log(values);
                    console.log('---');
                }
                let statement = sql.prepare(query, values);
                let items = [];
                while (statement.step()) {
                    items.push(statement.get());
                }
                statement.free();
                if (items.length === 0) {
                    items = null;
                }
                return items;
            },
            selectOne: function (table, fields, whereLogic, whereValues) {
                let fieldList = '';
                if (fields === '*') {
                    fieldList = '*';
                } else {
                    if (!Array.isArray(fields)) {
                        fields = [fields];
                    }
                    fieldList = '`' + fields.join('`, `') + '`';
                }
                let query = 'SELECT ' + fieldList + ' FROM `' + table + '`';
                let values = {};
                query = parseWhere(query, values, whereLogic, whereValues);
                if (debug === 1) {
                    console.log(query);
                    console.log(values);
                    console.log('---');
                }
                let statement = sql.prepare(query, values);
                statement.step();
                let item = {};
                let i = 0;
                for (let value of statement.get()) {
                    item[fields[i]] = value;
                    i++;
                }
                statement.free();
                return item;
            },
            insert: function (table, values) {
                let fields = values.getFields();
                values = values.getValues();
                let query = 'INSERT INTO `' + table + '` (`' + fields.join('`, `') + '`) VALUES (:' + fields.join(', :') + ')';
                if (debug === 1) {
                    console.log(query);
                    console.log(values);
                    console.log('---');
                }
                sql.run(query, values);
                needsDbSave = 1;
                return sql.exec('select last_insert_rowid()')[0].values[0][0];
            },
            update: function (table, values, whereLogic, whereValues) {
                if (table === undefined || table === '') {
                    return false;
                }
                let fields = values.getFields();
                let fieldSet = [];
                for (let field of fields) {
                    fieldSet.push('`' + field + '`=:' + field);
                }
                values = values.getValues();
                let query = 'UPDATE `' + table + '` SET ' + fieldSet.join(', ');
                query = parseWhere(query, values, whereLogic, whereValues);
                if (debug === 1) {
                    console.log(query);
                    console.log(values);
                    console.log('---');
                }
                sql.run(query, values);
                needsDbSave = 1;
                return true;
            },
            delete: function (table, whereLogic, whereValues) {
                if (table === undefined || table === '') {
                    return false;
                }
                let query = 'DELETE FROM `' + table + '`';
                let values = {};
                query = parseWhere(query, values, whereLogic, whereValues);
                if (debug === 1) {
                    console.log(query);
                    console.log(values);
                    console.log('---');
                }
                sql.run(query, values);
                needsDbSave = 1;
                return true;
            },
            saveToDisk: function () {
                if (debug === 1) {
                    console.log('saveToDisk? ' + needsDbSave);
                    console.log('---');
                }
                if (needsDbSave !== 1) {
                    return;
                }
                let data = sql.export();
                let buffer = new Buffer(data);
                try {
                    mkdirp.sync(dbDirPath, '0755');
                }
                catch (err) {
                    console.log(err);
                    return false;
                }
                try {
                    fs.writeFileSync(dbFilePath, buffer);
                }
                catch (err) {
                    console.log(err);
                    return false;
                }
                needsDbSave = 0;
                return true;
            }
        };
    }

    exports.Db = Db;

}());
