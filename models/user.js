import mongoose from "mongoose";

const userschema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // auth / profile
    role: { type: String, required: true, enum: ["admin", "player"], default: "player" },
    image: { type: String, default: "/images/default-profile.png", required: true },

    // game stats
    highScore: { type: Number, default: 0 },
    lastScore: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    reviveCredits: { type: Number, default: 1 },
    checkpointScore: { type: Number, default: 0 },
    checkpointMode: { type: String, enum: ["easy", "medium", "hard", ""], default: "" },
    checkpointEggs: { type: Number, default: 0 },
    checkpointHeartCount: { type: Number, default: 0 },
    checkpointRevivesUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("user", userschema);

export default User;
