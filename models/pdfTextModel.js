const mongoose = require("mongoose");

const pdfTextSchema = new mongoose.Schema({
  text: {
    type: String,
  },
});

module.exports = mongoose.model("pdftext", pdfTextSchema);
