const mongoose = require("mongoose");

const interviewRoundSchema = new mongoose.Schema({
  selectedInterviewRound: {
    type: String,
  },
  jobId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "job",
  },
  low: {
    type: Number,
    default: 0
  },
  high: {
    type: Number,
    default: 0
  },
  codingRoundDifficulty: {
    type: String,
  },
  codingRoundQuestions: {
    type: Number,
  },
  codingDuration: {
    type: Number,
  },
});

module.exports = mongoose.model("interviewRounds", interviewRoundSchema);
