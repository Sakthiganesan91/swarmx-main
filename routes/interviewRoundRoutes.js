const express = require("express");
const InterviewRound = require("../models/interviewRoundModel");
const JobPreference = require("../models/JobPreference")

const addInterviewRound = async (req, res) => {
  const jobId = req.params.id;
  const selectedInterviewRound = req.body.selectedInterviewRound;

  try {
    const existingInterviewRound = await InterviewRound.findOne({ jobId });
    if (existingInterviewRound) {
      existingInterviewRound.selectedInterviewRound = selectedInterviewRound;
      await existingInterviewRound.save();
      res.status(201).json({
        selectedInterviewRound: existingInterviewRound,
        message: "Interview Rounds Updated Successfully",
        success: true,
      });
      return;
    }
    const created = await InterviewRound.create({
      selectedInterviewRound,
      jobId,
    });

    res.status(201).json({
      selectedInterviewRound: created,
      message: "Interview Rounds Selected Successfully",
      success: true,
    });
  } catch (error) {
    res.status(409).json({
      error,
      success: false,
    });
  }
};

const saveInterviewScore = async (req, res) => {
  const jobId = req.params.id;
  const { low, high } = req.body;
  if (low === undefined || high === undefined) {
    return res.status(400).json({
      message: "Low and High values are required.",
      success: false,
    });
  }

  if (low > high) {
    return res.status(400).json({
      message: "Low value cannot be greater than High value.",
      success: false,
    });
  }

  try {
    const interviewRound = await InterviewRound.findOneAndUpdate(
      { jobId },
      { low, high },
      { upsert: true, new: true }
    );

    res.status(200).json({
      interviewRound,
      message: "Score saved successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error saving interview score:", error);
    res.status(500).json({
      message: "Error saving interview score",
      error: error.message,
      success: false,
    });
  }
};

const addCodingRoundDifficulty = async (req, res) => {
  const jobId = req.params.id;
  const codingRoundDifficulty = req.body.codingRoundDifficulty;
  const codingRoundQuestions = req.body.codingRoundQuestions;
  const codingDuration = req.body.codingDuration
  try {
    const existingInterviewRound = await InterviewRound.findOne({ jobId });
    if (existingInterviewRound) {
      existingInterviewRound.codingRoundDifficulty = codingRoundDifficulty;
      existingInterviewRound.codingRoundQuestions = codingRoundQuestions;
      existingInterviewRound.codingDuration = codingDuration;
      await existingInterviewRound.save();
      res.status(201).json({
        codingRoundDifficulty: existingInterviewRound,
        message: "Interview Rounds Updated Successfully",
        success: true,
      });
      return;
    }
    const created = await InterviewRound.create({
      codingRoundDifficulty,
      codingRoundQuestions,
      codingDuration,
      jobId,
    });

    res.status(201).json({
      codingRoundDifficulty: created,
      message: "Interview Rounds Selected Successfully",
      success: true,
    });
  } catch (error) {
    res.status(409).json({
      error,
      success: false,
    });
  }
};

const getInterviewRound = async (req, res) => {
  const jobId = req.params.id;
  let isPreferenceSet = false;

  try {

    const selectedInterviewRound = await InterviewRound.findOne({ jobId });
    const preferences = await JobPreference.find({ jobId })

    if (preferences.length > 0) {
      isPreferenceSet = true
    }
    res.status(201).json({
      selectedInterviewRound,
      isPreferenceSet
    });
  } catch (error) {
    res.status(401).json(error);
  }
};

const routes = express.Router();

routes.get("/get-interviewrounds/:id", getInterviewRound);
routes.post("/post-interviewrounds/:id", addInterviewRound);
routes.post("/add-coding-difficulty/:id", addCodingRoundDifficulty);
routes.post("/add-scorepreferences/:id", saveInterviewScore);

module.exports = routes;
