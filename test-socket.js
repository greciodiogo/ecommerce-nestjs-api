const { io } = require("socket.io-client");

// Change the URL/port if your backend is running elsewhere
const socket = io("http://localhost");

socket.on("connect", () => {
  console.log("Connected to server, sending ping...");
  socket.emit("ping", { test: "hello" });
});

socket.on("pong", (data) => {
  console.log("Received pong:", data);
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
});