const mongoose = require("mongoose");

const keywordSchema = new mongoose.Schema({
  keyword: {
    type: String,
  },
  label: {
    type: String,
  },
  value: {
    type: String,
  },
});

module.exports = mongoose.model("keyword", keywordSchema);
