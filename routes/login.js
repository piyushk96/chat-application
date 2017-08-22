/**
 * Created by piyush on 3/7/17.
 */
'use strict';
const router = require('express').Router();
const md5 = require('md5');
const db = require('../userDbhandler');

router.post('/', function (req, res) {
    const data = {
        empid : req.body.empid,
        password : md5(req.body.password)
    };
    db.loginUser(data, function(empid){
        if(empid == null){
            res.send({
                loggedIn : false,
                empid : empid
            });
        }
        else{
            res.send({
                loggedIn : true,
                empid : empid
            });
        }
    });
});

module.exports = router;