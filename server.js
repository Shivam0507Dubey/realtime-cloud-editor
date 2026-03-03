const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const connectedUsers = new Map();
let guestCounter = 1;

io.on('connection', (socket) => {
    // 1. Get the username sent from the frontend prompt
    let username = socket.handshake.query.username;
    
    // 2. If they left it blank, assign a Guest number
    if (!username || username.trim() === '') {
        username = 'Guest-' + guestCounter;
        guestCounter++;
    }
    
    connectedUsers.set(socket.id, username);
    console.log(`${username} connected. Total: ${connectedUsers.size}`);

    io.emit('users-update', Array.from(connectedUsers.values()));

    socket.on('code-change', (code) => {
        socket.broadcast.emit('code-update', code);
    });

    socket.on('cursor-change', (pos) => {
        socket.broadcast.emit('cursor-update', {
            username: connectedUsers.get(socket.id),
            pos: pos
        });
    });

    socket.on('disconnect', () => {
        connectedUsers.delete(socket.id);
        io.emit('users-update', Array.from(connectedUsers.values()));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});