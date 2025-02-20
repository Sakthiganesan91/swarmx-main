const mongoose = require("mongoose");

const uploadedFilesSchema = new mongoose.Schema({
  files: [
    {
      fileUrl: String,
      fileName: String,
    },
  ],
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },

  source: {
    type: String,
    required: true,
    default: "Employer",
  },
  jobId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "job",
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("uploaded files", uploadedFilesSchema);
