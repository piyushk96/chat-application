/**
 * Created by piyush on 5/7/17.
 */
'use strict';
const chatDB = require('../chatDbhandler');
const userDB = require('../userDbhandler');

let onlineUsers = {};

module.exports = function (io) {
    io.on('connection', function (socket) {
        socket.on('connectedNewUser', function (userInfo) {
            socket.empid = userInfo.empid;
            userInfo.socketId = socket.id;
            onlineUsers[userInfo.empid] = userInfo;
            userDB.updateOnlineStatus(userInfo.empid, true, function () {
                userInfo.online = true;
                chatDB.fetchChatList(userInfo.empid, function (chatlist) {
                    socket.emit('chatlist', chatlist);          //sending to current user
                    chatlist.forEach(function (val, index) {
                        if(onlineUsers[val.empid] != null) {

                            console.log('connected')

                            socket.broadcast.to(onlineUsers[val.empid].socketId).emit('updateOnlineStatus', {
                                empid: userInfo.empid,
                                onlinestatus: true
                            });
                        }
                    });
                });
            });
        });

        socket.on('sendMessage', function (msg) {
            // console.log(onlineUsers);
            if(onlineUsers[msg.to_id] != null) {
                socket.broadcast.to(onlineUsers[msg.to_id].socketId).emit('receiveMessage', msg);
            }
        });

        socket.on('updateMsgStatus', function (data) {

            /*  if data contain receivedtime then message is received by user (msgstatus = 'Y' or 'N')      [[emit from receiveMsg]]
                if data doesn't contain receivedtime then message is read by user (msgstatus = 'Y')
             */

            chatDB.updateMessageStatus(data, function () {
                if(onlineUsers[data.from_id] != null) {
                    socket.broadcast.to(onlineUsers[data.from_id].socketId).emit('msgStatusUpdated', data);
                }
            });
        });

        socket.on('msgDeliveryToNewOnlineUser', function (data) {
            chatDB.deliveredToNewConnec(data, function () {
                 socket.broadcast.emit('msgDelivered', data);
            });
        });

        socket.on('disconnect', function () {
            var empid = socket.empid;
            userDB.updateOnlineStatus(empid, false, function () {
                delete onlineUsers[empid];

                console.log('disconnected')

                io.emit('updateOnlineStatus', {
                    empid : empid,
                    onlinestatus : false
                });
            });
        });
    });
};