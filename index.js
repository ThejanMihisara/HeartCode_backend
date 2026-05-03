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
  .catch((err) => console.log("Error connecting to MongoDB", err));

const app = express();

// Fetching the frontend URL from environment variables for CORS configuration
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";  // Default to localhost for local development

// CORS Configuration: allowing requests from the frontend's URL
app.use(cors({
  origin: function (origin, callback) {
    // Allowing requests from the specified CLIENT_ORIGIN only (either Vercel frontend or localhost for dev)
    if (origin === CLIENT_ORIGIN || !origin) {  // !origin is for no origin requests, such as POSTMAN
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS')); // Rejecting other origins
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],  // Optional: You can add more allowed methods here
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],  // Optional: Specify which headers are allowed in the requests
}));

app.use(cookieParser());
app.use(express.json());

// Attach req.user if a JWT token exists
app.use(authorizeUser);

app.get("/", (req, res) => res.send("API running"));

// Use the routers for user, game, and heart routes
app.use("/users", userRouter);
app.use("/game", gameRouter);
app.use("/heart", heartRouter);

const PORT = process.env.PORT || 3000;  // Default to 3000 if no PORT is specified in the environment variables
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));