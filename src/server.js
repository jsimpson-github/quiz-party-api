const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const app = express()
const server = http.Server(app)
const io = socketIO(server)

app.set('port', 5000)

const state = {
    players: [],
    currentQuestion: null
}

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('join', data => {
        state.players.push(data.name)
        io.emit('stateUpdated', state)
    });

    socket.on('ask', ({ name, text }) => {
        state.currentQuestion = ({ name, text, answers: {}})
        io.emit('stateUpdated', state)
    });

    socket.on('answer', ({ name, answer }) => {
        state.currentQuestion.answers[name] = answer
        io.emit('stateUpdated', state)
    });

    io.emit('stateUpdated', state)
});

app.get('/ping', (request, response) => {
    response.send('pong')
})

server.listen(5000, () => {
  console.log('Starting server on port 5000')
})