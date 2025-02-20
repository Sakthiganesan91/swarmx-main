const mongoose = require("mongoose");
const { Schema } = mongoose;

const CodingQuestionSchema = new Schema({
    title: String,
    description: String,
    difficulty: String,
    testcase: Array
});

module.exports = mongoose.model("coding_questions", CodingQuestionSchema);
