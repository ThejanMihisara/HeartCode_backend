import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authorizeUser from "./lib/jwtMiddleware.js";
import userRouter from "./router/userRouter.js";
import gameRouter from "./router/gameRouter.js";
import heartRouter from "./router/heartRouter.js";

dotenv.config();

const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(() => console.log("Error connecting to MongoDB"));

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// attach req.user if token exists
app.use(authorizeUser);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/users", userRouter);
app.use("/api/game", gameRouter);
app.use("/api/heart", heartRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
