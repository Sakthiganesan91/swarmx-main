const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
    {
        feedback: {
            type: String,
            required: true,
        },
        hrName: {
            type: String,
            required: true,
        },
        candidateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "candidates",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("feedback", feedbackSchema);