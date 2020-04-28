const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
app.use(cors());
const server = http.Server(app);
const socketIO = require("socket.io")(server, { origins: "*:*" });
const io = socketIO(server);
io.origins("*:*");
const PORT = process.env.PORT || 5000;

app.set("port", PORT);

const state = {};

io.on("connection", function (socket) {
    id = socket.handshake.query ? socket.handshake.query.id : null;
    if (id) {
        socket.join(id);
        io.to(id).emit("stateUpdated", state[id]);
    }
    console.log("user connected");

    socket.on("disconnect", function () {
        console.log("user disconnected");
    });

    socket.on("newQuiz", (data, fn) => {
        id = Object.keys(state).length + 1;
        let quiz = {
            name: data.name,
            id: id,
            players: [],
            currentQuestion: null,
            active: true,
        };
        state[id] = quiz;
        fn(id);
    });

    socket.on("join", ({ id, name }) => {
        let newPlayer = {
            name: name,
            score: 0,
        };
        state[id].players.push(newPlayer);
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("ask", ({ id, name, text }) => {
        state[id].currentQuestion = {
            name,
            text,
            answers: {},
            forceMark: false,
        };
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("answer", ({ id, name, answer }) => {
        state[id].currentQuestion.answers[name] = answer;
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("results", ({ id, results }) => {
        updateScores(id, results);
        state[id].currentQuestion = null;
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("leave", ({ id, name }) => {
        state[id].players = state[id].players.filter(
            (player) => player.name != name
        );
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("forceMark", ({ id }) => {
        state[id].currentQuestion.forceMark = true;
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("finish", ({ id }) => {
        state[id].active = false;
        io.to(id).emit("stateUpdated", state[id]);
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
