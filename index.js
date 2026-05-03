import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

import authorizeUser from "./lib/jwtMiddleware.js";
import userRouter from "./router/userRouter.js";
import gameRouter from "./router/gameRouter.js";
import heartRouter from "./router/heartRouter.js";



const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(() => console.log("Error connecting to MongoDB"));

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*", // Allows all origins in case CLIENT_ORIGIN is not set
    credentials: true, // Allows cookies and authentication
  })
);
app.use(cookieParser());
app.use(express.json());

// attach req.user if token exists
app.use(authorizeUser);

app.get("/", (req, res) => res.send("API running"));

app.use("/users", userRouter);
app.use("/game", gameRouter);
app.use("/heart", heartRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
