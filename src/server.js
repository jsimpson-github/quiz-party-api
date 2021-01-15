const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const app = express();
const cors = require("cors");
app.use(cors());
const server = http.Server(app);
const io = socketIO(server);
io.origins("*:*");
const PORT = process.env.PORT || 5000;
const randomWords = require("random-words");

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
        id = randomWords({ exactly: 1, wordsPerString: 2, separator: "-" });
        let quiz = {
            name: data.name,
            id: id.join(),
            players: [],
            currentQuestion: null,
            active: true,
            typing: [],
            showScores: true,
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

    socket.on("showScores", ({ id, admin }) => {
        state[id].showScores = !state[id].showScores;
        io.to(id).emit("stateUpdated", state[id]);
        io.to(id).emit("scoresToggled", state[id].showScores, admin);
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
        io.to(id).emit("playerLeft", name);
    });

    socket.on("remove", ({ id, name, adminName }) => {
        state[id].players = state[id].players.filter(
            (player) => player.name != name
        );
        addNotification(
            id,
            adminName + " kicked out " + name + " from the quiz."
        );
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("forceMark", ({ id }) => {
        state[id].currentQuestion.forceMark = true;
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("typing", ({ id, name, active }) => {
        const typing = state[id].typing;
        if (!active) {
            state[id].typing = typing.filter((player) => player != name);
        } else if (!typing.includes(name)) {
            state[id].typing.push(name);
        }
        io.to(id).emit("stateUpdated", state[id]);
    });

    socket.on("finish", ({ id, name }) => {
        state[id].active = false;
        io.to(id).emit("stateUpdated", state[id]);
        io.to(id).emit("quizFinished", name);
    });

    socket.on("adjustScores", ({ id, scores, admin }) => {
        const playersAdjusted = adjustScores(id, scores);
        io.to(id).emit("stateUpdated", state[id]);
        io.to(id).emit("scoresAdjusted", playersAdjusted, admin);
    });

    socket.on("removePlayer", ({ id, name, admin }) => {
        state[id].players = state[id].players.filter(
            (player) => player.name != name
        );
        io.to(id).emit("stateUpdated", state[id]);
        io.to(id).emit("playerRemoved", name, admin);
    });

    io.emit("connected");
});

app.get("/ping", (request, response) => {
    response.send("pong");
});

server.listen(PORT, () => {
    console.log("Starting server on port " + PORT);
});

const updateScores = (id, results) => {
    state[id].players.forEach((player) => {
        if (results[player.name]) {
            player.score += results[player.name];
        }
    });
};

const adjustScores = (id, scores) => {
    const playersAdjusted = [];
    state[id].players.forEach((player) => {
        if (scores[player.name] && scores[player.name] != player.score) {
            player.score = parseFloat(scores[player.name]);
            playersAdjusted.push(player.name);
        }
    });
    return playersAdjusted;
};
