import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import loginRouter from "./src/routes/login.js";
import usersRouter from "./src/routes/users.js";
import inboxRouter from "./src/routes/inbox.js";
import profileRouter from "./src/routes/profile.js";
import {
  notFoundHanlder,
  errorHandler,
} from "./src/middlewares/common/error-handler.middleware.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

dotenv.config();

// database conntection
mongoose
  .connect(process.env.MONGO_CONNECTION_STRING)
  .then(() => {
    console.log("database connected!");
  })
  .catch((err) => {
    console.log("database connection failed!");
  });

// request process
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded());

// set view engine
app.set("views", path.join(__dirname, "src", "views"));
app.set("view engine", "ejs");


global.appRoot = __dirname;
// set static folder
app.use(express.static(path.join(__dirname, "src", "public")));

// parse cookie
app.use(cookieParser(process.env.COOKIE_SECRET));

// routing setup
app.use("/", loginRouter);
app.use("/users", usersRouter);
app.use("/inbox", inboxRouter);
app.use("/profile", profileRouter);

// 404 handling
app.use(notFoundHanlder);

// common error handling
app.use(errorHandler);

// create server
const server = createServer(app);

// socket setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

// share io to router
app.set("io", io);

// socket connection
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // when user joins a conversation
  socket.on("joinConversation", (id) => {
    socket.join(id);
    console.log(`User ${socket.id} joined conversation ${id}`);
    console.log("Joined room:", id, "Rooms:", socket.rooms);
  });

  // when user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// listen server
server.listen(process.env.PORT, () => {
  console.log("app listening on port ", process.env.PORT);
});