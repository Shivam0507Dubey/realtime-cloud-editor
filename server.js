const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" folder
app.use(express.static('public'));

// Handle Real-Time Connections
io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Listen for code changes from a client
    socket.on('code-change', (code) => {
        // Broadcast this change to EVERYONE else (except the sender)
        socket.broadcast.emit('code-update', code);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Use the port the cloud provider gives us, or 3000 locally
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});