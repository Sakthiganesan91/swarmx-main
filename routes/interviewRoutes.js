const express = require("express");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const routes = express.Router();
const Candidate = require("../models/candidateModal");
const InterviewRoundModel = require("../models/interviewRoundModel");
const User = require("../models/userModel");

const {
  sheduleInterview,
  scheduleCoding,
} = require("../helpers/emailTemplates");
const { transport } = require("../config/mailerTransport");

const generatePasswordForCandidate = async (candidateId, jobId, round) => {
  try {
    const password = otpGenerator.generate(8, {
      digits: true,
      lowerCaseAlphabets: true,
      upperCaseAlphabets: true,
      specialChars: true,
    });
    const candidate = await Candidate.findOne({ _id: candidateId, jobId });
    console.log(candidate);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    candidate.authentication = {
      ...candidate.authentication,
      [round]: hashedPassword,
    };
    await candidate.save();
    return password;
  } catch (error) {
    throw error;
  }
};

routes.post("/authenticate-candidate/:id/:jobId", async (req, res) => {
  try {
    const id = req.params.id;
    const jobId = req.params.jobId;
    const password = req.body.password;
    const round = req.body.round;

    const candidate = await Candidate.findOne({ _id: id, jobId });

    const match = await bcrypt.compare(
      password,
      candidate.authentication[round]
    );

    if (match) {
      res.status(201).json({
        success: true,
      });
    } else {
      throw Error("Check Password and Try Again");
    }
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
});

module.exports = routes;
