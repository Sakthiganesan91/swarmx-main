const mongoose = require("mongoose");

const subkeywordSchema = new mongoose.Schema({
  label: {
    type: String,
  },
  value: {
    type: String,
  },
});

module.exports = mongoose.model("subkeyword", subkeywordSchema);