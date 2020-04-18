const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set("port", 5000);

const state = {
    players: [],
    currentQuestion: null,
};

io.on("connection", function (socket) {
    console.log("a user connected");
    socket.on("disconnect", function () {
        if (true) {
            console.log("user disconnected");
        }
    });

    socket.on("join", (data) => {
        let newPlayer = {
            name: data.name,
            score: 0,
        };
        state.players.push(newPlayer);
        io.emit("stateUpdated", state);
    });

    socket.on("ask", ({ name, text }) => {
        state.currentQuestion = { name, text, answers: {} };
        io.emit("stateUpdated", state);
    });

    socket.on("answer", ({ name, answer }) => {
        state.currentQuestion.answers[name] = answer;
        io.emit("stateUpdated", state);
    });

    socket.on("results", ({ results }) => {
        updateScores(results);
        state.currentQuestion = null;
        io.emit("stateUpdated", state);
    });

    socket.on("leave", ({ name }) => {
        state.players = state.players.filter((player) => player.name != name);
        io.emit("stateUpdated", state);
    });

    io.emit("stateUpdated", state);
});

app.get("/ping", (request, response) => {
    response.send("pong");
});

server.listen(5000, () => {
    console.log("Starting server on port 5000");
});

function updateScores(results) {
    state.players.forEach((player) => {
        if (results[player.name]) {
            player.score += results[player.name];
        }
    });
}
