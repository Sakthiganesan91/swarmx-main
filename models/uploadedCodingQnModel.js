const mongoose = require("mongoose");
const { Schema } = mongoose;

const uploadedCodingQnSchema = new Schema({
    jobId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "job",
    },
    title: String,
    description: String,
    testcase: Array
});

module.exports = mongoose.model("uploaded_coding_questions", uploadedCodingQnSchema);
