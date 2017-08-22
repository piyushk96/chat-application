/**
 * Created by piyush on 4/7/17.
 */
'use strict';
const mysqlPool = require('./dbConfig');
const mysql = require('mysql');

let queryStr;

/*
* Message Status :
* W :- Not delivered (offline user)
* N :- Delivered but not read
* Y :- Delivered and read
* */

module.exports = {
    fetchChatList: function (empid, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if (err)
                console.log(err);
            else {
                let employees = [];
                let unreads = [];
                queryStr = 'SELECT from_id,to_id,msgstatus,COUNT(msgstatus) AS unreads,MAX(sendtime) AS maxsendtime' +
                    ' FROM chats WHERE from_id=? OR to_id=? GROUP BY from_id,to_id,msgstatus ' +
                    'ORDER BY maxsendtime DESC;';
                queryStr = mysql.format(queryStr, [empid, empid]);

                connection.query(queryStr, [empid, empid], function (err, rows1, fields) {
                    if (err) {
                        connection.release();
                        console.log(err);
                    }
                    else if (rows1.length > 0) {
                        rows1.forEach(function (val, index) {
                            let i;
                            if (val.from_id == empid) {                       // sent msg
                                i = employees.indexOf(val.to_id);
                                if (i == -1) {
                                    employees.push(val.to_id);
                                    unreads.push(0);
                                }
                            }
                            else if (val.to_id == empid) {                     // received msg
                                i = employees.indexOf(val.from_id);
                                if (i == -1) {
                                    employees.push(val.from_id);
                                    unreads.push(val.msgstatus != 'Y' ? val.unreads : 0);
                                }
                                else {
                                    unreads[i] = val.msgstatus != 'Y' ? val.unreads + unreads[i] : unreads[i];      // adding for 'W'and 'N'
                                }
                            }
                        });
                        queryStr = 'SELECT * FROM employees WHERE empid IN (?) ORDER BY FIELD(empid,?)';
                        queryStr = mysql.format(queryStr, [employees, employees]);

                        connection.query(queryStr, [employees, employees], function (err, rows, fields) {
                            connection.release();
                            if (err)
                                console.log(err);
                            else {
                                let rowArr = [];
                                for (let j = 0; j < rows.length; j++) {
                                    rowArr.push({
                                        empid: rows[j].empid,
                                        name: rows[j].name,
                                        designation: rows[j].designation,
                                        photo: rows[j].photo == null ? "" : "/uploads/profilepics/" + rows[j].photo,
                                        online: rows[j].online ? true : false,
                                        unreads: unreads[j]
                                    });
                                }
                                callback(rowArr);
                            }
                        });
                    }
                    else {
                        connection.release();
                        callback([]);
                    }
                });
            }
        });
    },
    getMessages: function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if (err)
                console.log(err);
            else {
                let messages = [];
                queryStr = 'SELECT c.*, m.filename, m.diskfilename, m.type FROM chats c LEFT JOIN media m on c.id=m.msgid ' +
                    'WHERE to_id=? AND from_id=? OR to_id=? AND from_id=? AND sendtime< ? ORDER BY sendtime;';

                let inserts = [data.u1, data.u2, data.u2, data.u1, data.startTime];
                queryStr = mysql.format(queryStr, inserts);

                connection.query(queryStr, function (err, rows, fields) {
                    connection.release();
                    if (err)
                        console.log(err);
                    else {
                        rows.forEach(function (row, i) {
                            messages.push({
                                id: row.id,
                                msgtext: row.msgtext,
                                from_id: row.from_id,
                                to_id: row.to_id,
                                sendtime: "" + row.sendtime,
                                receivetime: "" + row.receivetime,
                                msgstatus: row.msgstatus,
                            });
                            if (row.filename != null && row.filename != '') {
                                messages[i].mediaUrl = row.diskfilename != null ? "/uploads/" + row.diskfilename : "";
                                messages[i].mediaImageUrl = row.type == 'docs' ? '/assets/docs.svg' : "/uploads/" + row.diskfilename;
                                messages[i].filename = row.filename;
                                messages[i].type = row.type;
                            }
                        });
                        callback(messages);
                    }
                });
            }
        });
    },
    addMessage: function (msg, media, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if (err)
                console.log(err);
            else {
                queryStr = 'INSERT INTO chats SET ?;';
                connection.query(queryStr, msg, function (err, result) {
                    if (err) {
                        console.log(err);
                        connection.release();
                    }
                    else if (media.diskfilename != null && media.diskfilename != '') {
                        queryStr = 'INSERT INTO media VALUES(?,?,?,?);';
                        connection.query(queryStr, [result.insertId, media.filename, media.diskfilename, media.type], function (err, res) {
                            connection.release();
                            if (err)
                                console.log(err);
                            else {
                                msg.id = result.insertId;
                                msg.filename = media.filename;
                                msg.mediaUrl = "/uploads/" + media.diskfilename;
                                msg.mediaImageUrl = media.type == 'docs' ? '/assets/docs.svg' : "/uploads/" + media.diskfilename;
                                callback(msg);
                            }
                        });
                    }
                    else {
                        connection.release();
                        callback(msg);
                    }
                });
            }
        });
    },

    updateMessageStatus: function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if (err)
                console.log(err);
            else {
                let inserts = [];
                if (data.receivetime == null) {                               // Message Read By Receiver on selectUser
                    queryStr = 'UPDATE chats set msgstatus="Y" WHERE from_id=?' +
                        ' AND to_id=? AND msgstatus!="Y";';
                    inserts = [data.from_id, data.to_id];
                }
                else {                                                       // Message Received By Receiver
                    queryStr = 'UPDATE chats set msgstatus=?,receivetime=?' +
                        ' WHERE from_id=? AND to_id=? AND msgstatus="W";';
                    inserts = [data.msgstatus, data.receivetime, data.from_id, data.to_id];
                }
                queryStr = mysql.format(queryStr, inserts);
                connection.query(queryStr, function (err, result) {
                    connection.release();
                    if (err)
                        console.log(err);
                    else {
                        callback();
                    }
                });
            }
        });
    },

    deliveredToNewConnec: function (data, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if (err)
                console.log(err);
            else {
                let inserts = [];
                queryStr = 'UPDATE chats set msgstatus="N",receivetime=? WHERE to_id=?' +
                    ' AND msgstatus="W";';
                inserts = [data.receivetime, data.to_id];

                queryStr = mysql.format(queryStr, inserts);
                connection.query(queryStr, function (err, result) {
                    connection.release();
                    if (err)
                        console.log(err);
                    else {
                        callback();
                    }
                });
            }
        });
    },
    fetchContactList: function (empid, callback) {
        mysqlPool.getConnection(function (err, connection) {
            if (err)
                console.log(err);
            else {
                queryStr = "SELECT * FROM employees WHERE empid!=? ORDER BY name;";
                connection.query(queryStr, [empid], function (err, rows, fields) {
                    connection.release();
                    if (err)
                        console.log(err);
                    else {
                        let rowArr = [];
                        rows.forEach(function (val, index) {
                            rowArr.push({
                                empid: val.empid,
                                name: val.name,
                                designation: val.designation,
                                photo: val.photo == null ? "" : "/uploads/profilepics/" + val.photo,
                                online: val.online ? true : false
                            });
                        });

                        callback(rowArr);
                    }
                });
            }
        });
    }
};