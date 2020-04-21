const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set("port", 5000);

const state = {};

io.on("connection", function (socket) {
    console.log("a user connected");
    socket.on("disconnect", function () {
        console.log("user disconnected");
    });

    socket.on("newQuiz", (data) => {
        id = Object.keys(state).length + 1;
        let quiz = {
            name: data.name,
            id: id,
            players: [],
            currentQuestion: null,
        };
        state[id] = quiz;
        socket.emit("quizAdded", id);
    });

    socket.on("join", ({ id, name }) => {
        let newPlayer = {
            name: name,
            score: 0,
        };
        state[id].players.push(newPlayer);
        io.emit("stateUpdated", state[id]);
    });

    socket.on("ask", ({ id, name, text }) => {
        state[id].currentQuestion = {
            name,
            text,
            answers: {},
            forceMark: false,
        };
        io.emit("stateUpdated", state[id]);
    });

    socket.on("answer", ({ id, name, answer }) => {
        state[id].currentQuestion.answers[name] = answer;
        io.emit("stateUpdated", state[id]);
    });

    socket.on("results", ({ id, results }) => {
        updateScores(id, results);
        state[id].currentQuestion = null;
        io.emit("stateUpdated", state[id]);
    });

    socket.on("leave", ({ id, name }) => {
        state[id].players = state[id].players.filter(
            (player) => player.name != name
        );
        io.emit("stateUpdated", state[id]);
    });

    socket.on("forceMark", ({ id }) => {
        state[id].currentQuestion.forceMark = true;
        io.emit("stateUpdated", state[id]);
    });

    socket.on("getState", ({ id }) => {
        io.emit("stateUpdated", state[id]);
    });

    io.emit("connected");
});

app.get("/ping", (request, response) => {
    response.send("pong");
});

server.listen(5000, () => {
    console.log("Starting server on port 5000");
});

function updateScores(id, results) {
    state[id].players.forEach((player) => {
        if (results[player.name]) {
            player.score += results[player.name];
        }
    });
}
