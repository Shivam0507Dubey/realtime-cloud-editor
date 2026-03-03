// --- NEW: Ask for the user's name ---
const enteredName = prompt("Enter your name to join the collaborative session:");

// Connect to the Socket.io server and pass the name
const socket = io({
    query: { username: enteredName }
});

// Initialize CodeMirror Editor
const editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
    mode: "javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
    extraKeys: {"Ctrl-Space": "autocomplete"} 
});

editor.on("inputRead", function(instance, changeObj) {
    if (/^[a-zA-Z]+$/.test(changeObj.text[0])) {
        if (!instance.state.completionActive) {
            instance.showHint({ completeSingle: false });
        }
    }
});

// Send Local Cursor Moves
editor.on("cursorActivity", () => {
    const pos = editor.getCursor();
    document.getElementById('cursor-pos').innerText = `Ln ${pos.line + 1}, Col ${pos.ch + 1}`;
    socket.emit("cursor-change", pos);
});

// Code Synchronization
let isReceiving = false;

editor.on("change", (instance, changes) => {
    if (!isReceiving) {
        const code = instance.getValue();
        socket.emit("code-change", code);
    }
});

socket.on("code-update", (code) => {
    isReceiving = true;
    const cursor = editor.getCursor();
    editor.setValue(code);
    editor.setCursor(cursor);
    isReceiving = false;
});

// Dynamic User Sidebar & Colors
const collaboratorList = document.getElementById('collaborator-list');
const connectionStatus = document.getElementById('connection-status');
const avatarColors = ['#bd93f9', '#50fa7b', '#ff79c6', '#f1fa8c', '#ffb86c'];

let userColorMap = {};

socket.on('users-update', (users) => {
    collaboratorList.innerHTML = ''; 
    userColorMap = {}; 
    
    users.forEach((username, index) => {
        const initial = username.charAt(0).toUpperCase();
        const color = avatarColors[index % avatarColors.length];
        
        userColorMap[username] = color; 
        
        const userEl = document.createElement('div');
        userEl.className = 'collaborator';
        userEl.innerHTML = `
            <div class="avatar" style="background: ${color}; color: #181a1f;">${initial}</div>
            ${username}
        `;
        collaboratorList.appendChild(userEl);
    });

    connectionStatus.innerHTML = `<i class="fa-solid fa-wifi"></i> ${users.length} Online`;
});

// Receive Remote Cursor Moves
const remoteCursors = {}; 

socket.on('cursor-update', (data) => {
    const { username, pos } = data;
    
    if (remoteCursors[username]) {
        remoteCursors[username].clear();
    }
    
    const color = userColorMap[username] || '#61afef'; 
    
    const cursorEl = document.createElement('span');
    cursorEl.className = 'remote-cursor';
    cursorEl.style.borderColor = color;
    
    const flagEl = document.createElement('span');
    flagEl.className = 'remote-cursor-flag';
    flagEl.style.backgroundColor = color;
    flagEl.innerText = username;
    
    cursorEl.appendChild(flagEl);
    
    remoteCursors[username] = editor.setBookmark(pos, { widget: cursorEl, insertLeft: true });
    
    setTimeout(() => {
        if (flagEl) flagEl.style.opacity = '0';
    }, 2000);
});