const express = require("express");
const routes = express.Router();

const Feedback = require("../models/Feedback.model.js");

const storeFeedback = async (req, res) => {
    try {
        const { feedback, HRName } = req.body;

        const candidateId = req.params.candidateId;

        if (!feedback || !HRName || !candidateId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newFeedback = new Feedback({ feedback, hrName: HRName, candidateId });
        await newFeedback.save();

        res
            .status(201)
            .json({ message: "Feedback stored successfully", feedback: newFeedback });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getFeedbackByCandidateId = async (req, res) => {
    try {
        const { candidateId } = req.params;

        if (!candidateId) {
            return res.status(400).json({ message: "Candidate ID is required" });
        }

        const feedbacks = await Feedback.find({ candidateId });

        if (feedbacks.length === 0) {
            return res
                .status(404)
                .json({ message: "No feedback found for this candidate" });
        }

        res.status(200).json({ feedbacks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const { feedback, HRName } = req.body;
        const hrName = HRName;
        console.log(req.body);
        const updatedFeedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { feedback, hrName },
            { new: true, runValidators: true }
        );

        if (!updatedFeedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }
        console.log(updatedFeedback);
        res.status(200).json({
            message: "Feedback updated successfully",
            feedback: updatedFeedback,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deleteFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;

        const deletedFeedback = await Feedback.findByIdAndDelete(feedbackId);

        if (!deletedFeedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

routes.post("/add-feedback/:candidateId", storeFeedback);
routes.get("/get-feedback/:candidateId", getFeedbackByCandidateId);
routes.put("/update-feedback/:feedbackId", updateFeedback);
routes.delete("/delete-feedback/:feedbackId", deleteFeedback);

module.exports = routes;