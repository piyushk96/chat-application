/**
 * Created by piyush on 4/7/17.
 */
'use strict';
const router = require('express').Router();
const chatDB = require('../chatDbhandler');
const userDB = require('../userDbhandler');

router.post('/get_user_info', function(req, res){
    const empid = req.body.empid;
    userDB.fetchUser(empid, function (data) {
        res.send(data);
    });
});

router.post('/getMessages', function (req, res) {
    const data = {
        u1 : req.body.u1,
        u2 : req.body.u2,
        startTime : req.body.startTime
    };
    chatDB.getMessages(data, function (messages) {
        res.send(messages);
    });
});

router.post('/addMessage', function (req, res) {
    if(req.body.to_id != null){
        let newMsg = {
            msgtext : req.body.msgtext,
            from_id : req.body.from_id,
            to_id : req.body.to_id,
            sendtime : req.body.sendtime,
            msgstatus : req.body.msgstatus
        };
        chatDB.addMessage(newMsg, {}, function (msg) {
            res.send(msg);
        });
    }
    else{
        let resultList = [];
        for(let i=0; i<req.body.sendList.length; i++){
            let newMsg = {
                msgtext : req.body.msgtext,
                from_id : req.body.from_id,
                to_id : req.body.sendList[i].empid,
                sendtime : req.body.sendtime,
                msgstatus : req.body.msgstatus
            };
            chatDB.addMessage(newMsg, {}, function (msg) {
                resultList.push(msg);
                if(resultList.length == req.body.sendList.length)
                    res.send(resultList);
            });
        }
    }


});

router.post('/getContactList', function (req, res) {
    chatDB.fetchContactList(req.body.empid, function (result) {
        res.send(result);
    });
});



router.post('/logout', function(req, res) {
    userDB.updateOnlineStatus(req.body.empid, false, function () {
        res.send({status : 'success'});
    });
});

module.exports = router;
//
// image/*,video/*,text/plain,text/rtf,application/pdf,application/msword,application/vnd.ms-excel,
// application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,
// application/vnd.openxmlformats-officedocument.presentationml.presentation,
// application/vnd.openxmlformats-officedocument.spreadsheetml.sheet