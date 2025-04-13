const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const compression = require("compression");
const SocketServer = require("./socketServer");
const { ExpressPeerServer } = require("peer");


const Connection = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Error while connecting with the database ", error);
  }
};
Connection();



// //imported Routes
const authRoute = require("./routes/auth.js");
const postRoute = require("./routes/post.js");
const userRoute = require("./routes/user.js");
const commentRoute = require("./routes/comment.js");
const messageRoute = require("./routes/message.js");
const pushNotifyTokenRoute = require("./routes/pushNotifyToken");
const notifyRoute = require("./routes/notify");
const adminAuthRoute = require("./routes/admin/auth.js");
const approvalRoute = require("./routes/admin/approval.js");
const adminPostRoute = require("./routes/admin/post.js");

//Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(
  compression({
    level: 9,
  })
);

// //My Routes
app.use("/api/v1", authRoute);
app.use("/api/v1", postRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", commentRoute);
app.use("/api/v1", messageRoute);
app.use("/api/v1", pushNotifyTokenRoute);
app.use("/api/v1", notifyRoute);
app.use("/api/v1", adminAuthRoute);
app.use("/api/v1", approvalRoute);
app.use("/api/v1", adminPostRoute);

app.use("/home",(req,res)=>{
  res.send("Welcome to home page");
})

// Socket
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let users = [];

io.on("connection", (socket) => {
  //when server starts
  console.log("a user connected")

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    !users.some((user) => user.userId === userId) &&
      users.push({ userId, socketId: socket.id });
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", (msg) => {
    // console.log("msg", msg);
    // console.log("userss", users);
    const user = users.find((user) => user?.userId === msg.recipient);
    // console.log("users", user);
    io.to(user?.socketId).emit("getMessage", msg);
  });

  //typing and stop typing
  socket.on("typing", (data) => {
    if (data) {
      const user = users.find((user) => user?.userId === data.recipient);
      io.to(user?.socketId).emit("isTyping", data);
    }
  });

  //when user disconnects
  socket.on("disconnect", () => {
    console.log("a user disconnected")
    users = users.filter((user) => user.socketId !== socket.id);
    io.emit("getUsers", users);
  });

  socket.on("chat", (payload) => {
    // console.log("what is payload", payload);
    io.emit("chat", payload);
  });

  // SocketServer(socket);
});

// Create peer server
ExpressPeerServer(http, { path: "/" });

//starting a server
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
