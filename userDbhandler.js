/**
 * Created by piyush on 28/6/17.
 */
'use strict';
const mysqlPool = require('./dbConfig');
const mysql = require('mysql');

let queryStr;

module.exports = {
    addUser : function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if(err)
                console.log(err);
            else{
                queryStr = 'INSERT INTO employees SET ?;' ;
                connection.query(queryStr, data, function (err, result) {
                    connection.release();
                    if(err)
                        console.log(err);
                    else{
                        callback();
                    }
                });
            }
        });
    },
    fetchUser : function (empid, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if(err)
                console.log(err);
            else{
                queryStr = 'SELECT empid,name,designation,photo,online,email FROM employees WHERE empid=? ;';
                connection.query(queryStr, [empid], function (err, rows, cols) {
                    connection.release();
                    if(err)
                        console.log(err);
                    else{
                        let obj = {};
                        if(rows.length > 0) {
                            obj = {
                                empid : rows[0].empid,
                                name : rows[0].name,
                                photo : rows[0].photo==null ? "" : "/uploads/profilepics/" + rows[0].photo,
                                designation : rows[0].designation,
                                online : rows[0].online ? true : false,
                                email : rows[0].email
                            }
                        }
                        callback(obj);
                    }
                });
            }
        });
    },
    loginUser : function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if(err)
                console.log(err);
            else{
                queryStr = 'SELECT * FROM employees WHERE empid=? and password=? ;';
                connection.query(queryStr, [data.empid, data.password], function (err, rows, cols) {
                    connection.release();
                    if(err)
                        console.log(err);
                    else
                        callback((rows.length==0)?null:rows[0].empid);
                });
            }
        });
    },
    updateOnlineStatus : function (empid, online, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if(err)
                console.log(err);
            else{
                queryStr = 'UPDATE employees SET online=? WHERE empid=?;';
                // queryStr = mysql.format(queryStr, [online, empid]);
                connection.query(queryStr, [online, empid], function (err, result) {
                    connection.release();
                    if(err)
                        console.log(err);
                    else
                        callback();
                });
            }
        });
    },
    resetPassword : function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if(err)
                console.log(err);
            else{
                queryStr = 'UPDATE employees SET password=? WHERE empid=?;';
                connection.query(queryStr, [data.password, data.empid], function (err, result) {
                    connection.release();
                    if(err)
                        console.log(err);
                    else
                        callback();
                });
            }
        });
    }
};