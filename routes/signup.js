/**
 * Created by piyush on 3/7/17.
 */
'use strict';
const router = require('express').Router();
const md5 = require('md5');
const multer = require('multer');
const mime = require('mime');
const db = require('../userDbhandler');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public_html/uploads/profilepics')
    },
    filename: function (req, file, cb) {
        cb(null, 'file_' + Date.now() + '.' + mime.extension(file.mimetype));
    }
});

const upload = multer({ storage: storage }).single('file');

router.post('/checkUser', function (req, res) {
    db.fetchUser(req.body.empid, function (obj) {
        if(obj.empid != null) {
            res.send({alreadyRegistered : true});
        }
        else{
            res.send({alreadyRegistered : false});
        }
    });
});

router.post('/withImage', function (req, res) {
    upload(req, res, function (err) {
        if(err) {
            console.log(err);
            res.send({
                err : true,
                result : err
            });
        }
        else{
            const request = JSON.parse(req.body.data);
            const data = {
                empid : request.empid,
                name : request.name,
                password : md5(request.password),
                designation : request.designation,
                photo : req.file.filename,
                online : true,
                email : request.email
            };

            db.addUser(data, function () {
                res.send({
                    err: false,
                    result: data.empid
                });
            });
        }
    });
});

router.post('/withoutImage', function (req, res) {
    const data = {
        empid : req.body.empid,
        name : req.body.name,
        password : md5(req.body.password),
        designation : req.body.designation,
        photo : null,
        online : true,
        email : req.body.email
    };

    db.addUser(data, function () {
        res.send({
            err: false,
            result: data.empid
        });
    });
});

module.exports = router;