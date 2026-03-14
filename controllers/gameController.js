import User from "../models/user.js";
import PerformanceLog from "../models/performanceLog.js";

function normalizeMode(mode) {
  return ["easy", "medium", "hard"].includes(mode) ? mode : "easy";
}

export async function submitRun(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });

    const { score = 0, eggCount = 0, revived = 0, durationSeconds = 0, mode = "easy" } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.lastScore = Math.max(0, Number(score) || 0);
    user.highScore = Math.max(user.highScore, user.lastScore);
    user.totalRuns += 1;
    user.checkpointScore = 0;
    user.checkpointMode = "";
    user.checkpointEggs = 0;
    user.checkpointHeartCount = 0;
    user.checkpointRevivesUsed = 0;

    await user.save();
    await PerformanceLog.create({
      user: user._id,
      score: user.lastScore,
      eggCount: Math.max(0, Number(eggCount) || 0),
      revived: Math.max(0, Number(revived) || 0),
      durationSeconds: Math.max(0, Number(durationSeconds) || 0),
      mode: normalizeMode(mode),
    });

    res.json({
      message: "Run saved",
      stats: {
        lastScore: user.lastScore,
        highScore: user.highScore,
        totalRuns: user.totalRuns,
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to save run" });
  }
}

export async function leaderboard(req, res) {
  try {
    const top = await User.find({ role: "player" })
      .select("firstName lastName username image highScore")
      .sort({ highScore: -1, updatedAt: 1 })
      .limit(10);

    res.json({ top });
  } catch {
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
}

export async function consumeReviveCredit(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.reviveCredits <= 0) {
      return res.status(400).json({ message: "No revive credits left" });
    }

    user.reviveCredits -= 1;
    await user.save();

    res.json({ message: "Revive credit used", reviveCredits: user.reviveCredits });
  } catch {
    res.status(500).json({ message: "Failed to use revive" });
  }
}

export async function getProgressLog(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });

    const user = await User.findById(req.user.id).select("firstName lastName username email image highScore lastScore totalRuns coins reviveCredits checkpointScore checkpointMode checkpointEggs checkpointHeartCount checkpointRevivesUsed createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    const runs = await PerformanceLog.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("score eggCount revived durationSeconds mode createdAt");

    const totalRevives = runs.reduce((sum, run) => sum + (run.revived || 0), 0);
    const averageScore = runs.length ? Math.round(runs.reduce((sum, run) => sum + (run.score || 0), 0) / runs.length) : 0;
    const totalEggs = runs.reduce((sum, run) => sum + (run.eggCount || 0), 0);

    res.json({
      summary: {
        user,
        totalRevives,
        averageScore,
        totalEggs,
        bestRecentScore: runs[0]?.score || 0,
      },
      runs,
    });
  } catch {
    res.status(500).json({ message: "Failed to load progress log" });
  }
}

export async function saveCheckpoint(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });

    const { score = 0, mode = "easy", eggCount = 0, heartCount = 0, revivesUsed = 0 } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const safeScore = Math.max(0, Number(score) || 0);
    const safeEggCount = Math.max(0, Number(eggCount) || 0);
    const safeHeartCount = Math.max(0, Number(heartCount) || 0);
    const safeRevivesUsed = Math.max(0, Number(revivesUsed) || 0);

    const hasCheckpoint =
      safeScore > 0 ||
      safeEggCount > 0 ||
      safeHeartCount > 0 ||
      safeRevivesUsed > 0;

    user.checkpointScore = safeScore;
    user.checkpointMode = hasCheckpoint ? normalizeMode(mode) : "";
    user.checkpointEggs = hasCheckpoint ? safeEggCount : 0;
    user.checkpointHeartCount = hasCheckpoint ? safeHeartCount : 0;
    user.checkpointRevivesUsed = hasCheckpoint ? safeRevivesUsed : 0;

    await user.save();

    res.json({
      checkpointScore: user.checkpointScore,
      checkpointMode: user.checkpointMode,
      checkpointEggs: user.checkpointEggs,
      checkpointHeartCount: user.checkpointHeartCount,
      checkpointRevivesUsed: user.checkpointRevivesUsed,
    });
  } catch {
    res.status(500).json({ message: "Failed to save checkpoint" });
  }
}

export async function getCheckpoint(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });
    const user = await User.findById(req.user.id).select("checkpointScore checkpointMode checkpointEggs checkpointHeartCount checkpointRevivesUsed");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      checkpointScore: user.checkpointScore || 0,
      checkpointMode: user.checkpointMode || "",
      checkpointEggs: user.checkpointEggs || 0,
      checkpointHeartCount: user.checkpointHeartCount || 0,
      checkpointRevivesUsed: user.checkpointRevivesUsed || 0,
    });
  } catch {
    res.status(500).json({ message: "Failed to load checkpoint" });
  }
}

export async function clearCheckpoint(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.checkpointScore = 0;
    user.checkpointMode = "";
    user.checkpointEggs = 0;
    user.checkpointHeartCount = 0;
    user.checkpointRevivesUsed = 0;
    await user.save();
    res.json({ message: "Checkpoint cleared" });
  } catch {
    res.status(500).json({ message: "Failed to clear checkpoint" });
  }
}
