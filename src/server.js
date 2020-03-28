const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);

const state = {
    players: [],
    question: {
        text: ""
    }
}

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('join', data => {
        console.log(data.name)
        state.players.push(data.name)
        io.emit('stateUpdated', state)
    });
    socket.on('ask', data => {
        state.question = ({name: data.name, text: data.text, answers: {}})
        io.emit('stateUpdated', state)
    });
});

app.get('/ping', function(request, response) {
    response.send('pong');
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});