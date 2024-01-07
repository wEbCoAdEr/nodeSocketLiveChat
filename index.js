// Import required modules
const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const helmet = require("helmet");
const xss = require("xss-clean");

// Create an Express application
const app = express();

// Enable CORS, security headers, and XSS protection
app.use(cors());

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(xss());

// Create an HTTP server using Express
const server = createServer(app);

// Create a Socket.IO server and attach it to the HTTP server
const io = new Server(server, {
  maxHttpBufferSize: 1e8, // 100 MB
});

// Set up a static directory for serving files
app.use(express.static("public"));

let users = []; // Keep track of users (not used in the provided code)

// Event handler for when a user connects to the server
io.on("connection", (socket) => {
  console.log("A user has been connected");

  // Event handler for when a user joins the chat
  socket.on("join", (username) => {
    if (username !== "") {
      // Assign username and generate a unique userID
      socket.username = username;
      socket.userID = uuidv4();
      console.log(`User ${username} joined the chat`);

      // Broadcast to all clients that a user has joined
      io.emit("joinedChat", { message: `<b>${username}</b> joined the chat` });
    } else {
      console.log(`Username not found!`);
      // Broadcast to all clients that a chat reload is required
      io.emit("reloadChat", { status: 0, message: `Chat reload required` });
    }
  });

  // Event handler for when a user is typing
  socket.on("userTyping", (message) => {
    // Broadcast to all clients that a user is typing
    io.emit("userTyping", {
      username: socket.username,
      userID: socket.userID,
      message,
    });
  });

  // Event handler for when a user sends a chat message
  socket.on("chat message", (data) => {
    const { message, image } = data;
    console.log(`Received message from ${socket.username}: ${message}`);
    // Broadcast the chat message to all clients
    io.emit("chat message", { username: socket.username, message, image });
  });

  // Event handler for when a user disconnects
  socket.on("disconnect", () => {
    console.log("A user disconnected");

    // Broadcast to all clients that a user has left
    io.emit("leftChat", { message: `<b>${socket.username}</b> left the chat` });
  });
});

// Set the server to listen on port 3003
const port = 3003;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
