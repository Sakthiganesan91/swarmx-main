// jobModel.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
    },
    minimumSalary: {
      type: Number,
    },
    maximumSalary: {
      type: Number,
    },
    currencyval: {
      type: String,
      required: true,
    },
    education: {
      type: [String],
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    vacancies: {
      type: Number,
      required: true,
    },

    jobBenefits: {
      type: [String],
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    expDate: {
      type: Date,
      required: true,
    },
    workMode: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
