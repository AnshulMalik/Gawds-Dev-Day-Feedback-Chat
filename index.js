// TODO:: Prevent XSS on backend

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var MongoClient = require('mongodb').MongoClient;

function postToDb(data) {
    MongoClient.connect('mongodb://localhost:27017/dd', function(err, db) {
        if(err)
            throw err;

        db.collection('messages').insertOne(data);
    });
}

app.use(express.static('public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/chatroom', function(req, res) {
    res.sendFile(__dirname + '/chatroom.html');
})

app.get('/recent', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    MongoClient.connect('mongodb://localhost:27017/dd', function(err, db) {
        if(err)
            throw err;

        db.collection('messages').find().sort({createdAt: -1}).limit(20).toArray(function(err, result) {
            if(err)
                throw err;

            res.send(JSON.stringify(result));
        });
    })
});

io.on('connection', function(socket) {
    console.log("new connection");
    socket.on('message', function(msgBody) {
        if(msgBody.name && msgBody.message) {
            msgBody.createdAt = new Date();
            postToDb({fromId: msgBody.fromId, name: msgBody.name, message: msgBody.message, createdAt: msgBody.createdAt});
            socket.broadcast.emit('message', {fromId: msgBody.fromId, name: msgBody.name, message: msgBody.message, createdAt: msgBody.createdAt});
        }
    });
});

http.listen(3000, function() {
    console.log("listening on 3000");
})
