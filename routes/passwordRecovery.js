/**
 * Created by piyush on 25/7/17.
 */
'use strict';
const router = require('express').Router();
const md5 = require('md5');
const nodemailer = require('nodemailer');
const path = require('path');
const userDB = require('../userDbhandler');
const recoverDB = require('../passwordRecoveryDbHandler');
const emailConfig = require('../emailConfig');

let transporter;

function initializeNodemailer() {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailConfig.emailId,
            pass: emailConfig.password
        }
    });
}

router.post('/forgotPassword', function (req, res) {
    userDB.fetchUser(req.body.empid, function (obj) {
        if(obj.empid != null) {
            const data = {
                empid : obj.empid,
                token : md5(obj.empid+Date.now())
            };

            recoverDB.addToken(data, function (result) {
                let recoveryLink = req.body.url + '/passwordreset/' + result.empid + '/' + result.token;

                initializeNodemailer();
                var mailOptions = {
                    from: emailConfig.emailId,
                    to: obj.email,
                    subject: 'HPCL Chat Password Recovery',
                    html: '<div>Click on following link to reset your password</div><br>' +
                            '<a target="_blank" href="' + recoveryLink + '">' + recoveryLink + '</a>'
                };

                transporter.sendMail(mailOptions, function(err, info) {
                    if (err)
                        console.log(err);
                    else
                        res.send({exist: true});
                });
            });
        }
        else{
            res.send({exist : false});
        }
    });
});

router.get('/passwordreset/:empid/:token', function (req, res) {
    const data = {
        empid : req.params.empid,
        token : req.params.token
    };
    recoverDB.fetchToken(data, function (empid) {
        if(empid == "")
            res.status(404).send('Invalid Link');
        else
            res.sendFile(path.resolve('./public_html/passwordRecovery.html'));
    })
});

router.post('/passwordreset', function (req, res) {
    const data = {
        empid : req.body.empid,
        password : md5(req.body.password)
    };
    userDB.resetPassword(data, function () {
        res.send({
            success: true
        });
    });
});

module.exports = router;
