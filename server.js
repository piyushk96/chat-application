/**
 * Created by piyush on 20/6/17.
 */
'use strict';
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const bodyParser = require('body-parser');

const login = require('./routes/login');
const signup = require('./routes/signup');
const chat = require('./routes/chatServer');
const upload = require('./routes/upload');
const pswdRecovery = require('./routes/passwordRecovery');

const app = express();
const server = http.Server(app);
const io = socketio(server);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/login', login);
app.use('/signup', signup);
app.use('/chat', chat);
app.use('/chat/upload', upload);
app.use('/', pswdRecovery);

app.use('/', express.static(__dirname + '/public_html'));
app.set('port', process.env.PORT || 9000);

require('./routes/socketHandler')(io);

app.get('/chat', function (req, res) {
    res.sendFile('public_html/chat.html', {root: __dirname });
});

app.get('/login', function (req, res) {
    res.sendFile('public_html/login.html', {root: __dirname });
});

app.get('/signup', function (req, res) {
    res.sendFile('public_html/signup.html', {root: __dirname });
});


// const temp = require('./chatDbhandler');
// temp.addvalues();


server.listen(app.get('port'), function () {
    console.log("http://localhost:" + app.get('port'));
});



