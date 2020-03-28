const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);

const state = {
    users: []
}

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

app.get('/ping', function(request, response) {
    response.send('pong');
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});