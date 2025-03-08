const mongoose = require("mongoose");
const { Schema } = mongoose;

const candidateSchema = new Schema(
  {
    jobId: String,
    jobTitle: String,
    resume: Object,
    score: Number,
    interviewScheduledDate: Date,
    interviewEndDate: Date,
    stage: String,
    status: String,
    date: Date,
    stageStatus: Object,
    reason: Object,
    userId: String,
    authentication: Object,
    cvUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("candidates", candidateSchema);
