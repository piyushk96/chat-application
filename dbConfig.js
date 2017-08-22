/**
 * Created by piyush on 5/7/17.
 */
'use strict';
const mysql = require('mysql');

const pool = mysql.createPool({
    host : 'localhost',
    user : 'chatuser',
    database : 'chatdb'
    // password : '123456'
});


exports.getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};