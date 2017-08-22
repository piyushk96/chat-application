/**
 * Created by piyush on 25/7/17.
 */
'use strict';
const mysqlPool = require('./dbConfig');
const mysql = require('mysql');

let queryStr = "";

module.exports = {
    addToken : function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if(err)
                console.log(err);
            else{
                queryStr = 'INSERT INTO passwordrecovery SET ? ON DUPLICATE KEY UPDATE token=?;' ;
                connection.query(queryStr, [data, data.token], function (err, result) {
                    connection.release();
                    if(err)
                        console.log(err);
                    else{
                        callback(data);
                    }
                });
            }
        });
    },
    fetchToken : function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if(err)
                console.log(err);
            else{
                queryStr = 'SELECT * FROM passwordrecovery WHERE empid=? AND token=?;' ;
                connection.query(queryStr, [data.empid, data.token], function (err, rows, fields) {
                    connection.release();
                    if(err)
                        console.log(err);
                    else{
                        if(rows.length>0)
                            callback(rows[0].empid);
                        else
                            callback("");
                    }
                });
            }
        });
    }
};