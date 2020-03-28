const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);app.set('port', 5000);

app.get('/ping', function(request, response) {
  response.send('pong');
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});