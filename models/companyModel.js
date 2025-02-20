const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    company: {
      type: String,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("company", companySchema);
