const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    duration: {
      type: Date,
      required: true,
    },
    user: {},
  },
  { timestamps: true }
);

module.exports = mongoose.model("otp", otpSchema);
