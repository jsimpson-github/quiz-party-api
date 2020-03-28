const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const app = express()
const server = http.Server(app)
const io = socketIO(server)

app.set('port', 5000)

const state = {
    players: []
}

const join = ({name}) => {
    state.players.push(name)
    io.emit('stateUpdated', state)
}

io.on('connection', function(socket){
    console.log('a user connected')
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    socket.on('join', join)
})

app.get('/ping', (request, response) => {
    response.send('pong')
})

server.listen(5000, () => {
  console.log('Starting server on port 5000')
})