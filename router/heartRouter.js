import express from "express";
import { getHeartPuzzle } from "../controllers/heartController.js";

const heartRouter = express.Router();

heartRouter.get("/puzzle", getHeartPuzzle);

export default heartRouter;
