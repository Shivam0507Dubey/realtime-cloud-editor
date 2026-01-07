// Connect to the Socket.io server
const socket = io();

// Initialize CodeMirror Editor
const editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
    mode: "javascript",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
});

// Flag to prevent loop (receiving our own update and sending it back)
let isReceiving = false;

// 1. Listen for changes in the editor
editor.on("change", (instance, changes) => {
    if (!isReceiving) {
        const code = instance.getValue();
        // Send code to server
        socket.emit("code-change", code);
    }
});

// 2. Listen for updates from the server (other users)
socket.on("code-update", (code) => {
    isReceiving = true;
    
    // Calculate cursor position to avoid jumping to top
    const cursor = editor.getCursor();
    editor.setValue(code);
    editor.setCursor(cursor);
    
    isReceiving = false;
});