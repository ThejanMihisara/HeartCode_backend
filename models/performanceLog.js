import mongoose from "mongoose";

const performanceLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    score: { type: Number, default: 0 },
    eggCount: { type: Number, default: 0 },
    revived: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    mode: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
  },
  { timestamps: true }
);

const PerformanceLog = mongoose.model("performance_log", performanceLogSchema);

export default PerformanceLog;
