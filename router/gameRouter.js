import express from "express";
import { clearCheckpoint, consumeReviveCredit, getCheckpoint, getProgressLog, leaderboard, saveCheckpoint, submitRun } from "../controllers/gameController.js";

const gameRouter = express.Router();

gameRouter.post("/run", submitRun);
gameRouter.get("/leaderboard", leaderboard);
gameRouter.post("/revive/use", consumeReviveCredit);
gameRouter.get("/progress-log", getProgressLog);
gameRouter.get("/checkpoint", getCheckpoint);
gameRouter.post("/checkpoint", saveCheckpoint);
gameRouter.delete("/checkpoint", clearCheckpoint);

export default gameRouter;
