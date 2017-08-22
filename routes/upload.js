/**
 * Created by piyush on 20/7/17.
 */
'use strict';
const router = require('express').Router();
const multer = require('multer');
const mime = require('mime');
const chatDB = require('../chatDbhandler');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public_html/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, 'file_' + Date.now() + '.' + mime.extension(file.mimetype));
    }
});

const upload = multer({ storage: storage }).array('file');

router.post('/', function (req, res) {
    upload(req, res, function (err) {
        if(err) {
            console.log(err);
            res.send({
                err : true,
                result : err
            });
        }
        else{
            let message = JSON.parse(req.body.newMsg);
            let files = req.files;

            let resultList = [];

            if(message[0].to_id != null){
                for(let i=0; i<message.length; i++){
                    let newMsg = {
                        msgtext: message[i].msgtext,
                        from_id: message[i].from_id,
                        to_id: message[i].to_id,
                        sendtime: message[i].sendtime,
                        msgstatus: message[i].msgstatus
                    };
                    let media = {
                        filename : files[i].originalname,
                        diskfilename : files[i].filename,
                        type : message[i].type
                    };
                    chatDB.addMessage(newMsg, media, function (msg) {
                        resultList.push(msg);
                        if(resultList.length == files.length){
                            res.send({
                                err : false,
                                result : resultList
                            });
                        }
                    });
                }
            }
            else{
                const sendList = message[0].sendList;
                for(let i=0; i<sendList.length; i++){
                    resultList[i] = [];
                    for(let j=0; j<message.length; j++){
                        let newMsg = {
                            msgtext: message[j].msgtext,
                            from_id: message[j].from_id,
                            to_id: sendList[i].empid,
                            sendtime: message[j].sendtime,
                            msgstatus: message[j].msgstatus
                        };
                        let media = {
                            filename : files[j].originalname,
                            diskfilename : files[j].filename,
                            type : message[i].type
                        };
                        //     media.type = 'docs';
                        chatDB.addMessage(newMsg, media, function (msg) {
                            resultList[i].push(msg);
                            if(resultList.length == sendList.length && resultList[resultList.length-1].length == message.length){
                                res.send({
                                    err : false,
                                    result : resultList
                                });
                            }
                        });
                    }

                }
            }
        }
    });
});

module.exports = router;