const express = require("express");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");

const Candidate = require("../models/candidateModal");
const InterviewRoundModel = require("../models/interviewRoundModel");
const Prefernce = require("../models/JobPreference");

const routes = express.Router();
const Job = require("../models/jobModel");
const User = require("../models/userModel");

const { transport } = require("../config/mailerTransport");
const {
  scheduleCoding,
  sheduleInterview,
} = require("../helpers/emailTemplates");

const azure = require("../config/azureStorage");

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} = require("@azure/storage-blob");

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

const getBlobUrlWithSasToken = async (containerName, blobName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: "r",
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour expiry
    },
    sharedKeyCredential
  ).toString();

  const blobUrl = `${containerClient.url}/${blobName}?${sasToken}`;
  return blobUrl;
};

function extractContainerAndBlobName(blobUrl) {
  try {
    // Create a URL object
    const url = new URL(blobUrl);

    // Extract the path part of the URL (after the domain)
    const path = url.pathname; // e.g., "/container-name/blob-name.jpg"

    // Split the path to get container name and blob name
    const parts = path.split("/").filter(Boolean); // Removes empty parts
    if (parts.length < 2) {
      throw new Error("Invalid Blob URL: Missing container or blob name.");
    }

    const containerName = parts[0]; // First part is the container name
    const blobName = parts.slice(1).join("/"); // Rest is the blob name

    return { containerName, blobName };
  } catch (error) {
    console.error("Error extracting container and blob name:", error);
    return null;
  }
}

const getCandidateCV = async (req, res) => {
  const _id = req.params.candidateId;
  console.log(_id);
  if (!_id) throw new Error("Candidate id not valid");

  try {
    const candidate = await Candidate.findOne({ _id });

    const cvUrl = candidate.cvUrl;
    console.log(cvUrl);
    if (cvUrl) {
      const { containerName, blobName } = extractContainerAndBlobName(cvUrl);

      const candidateResumeUrl = await getBlobUrlWithSasToken(
        containerName,
        blobName
      );

      const extension = candidateResumeUrl.split(".").pop().split("?")[0];
      console.log(extension);
      res.status(201).json({
        candidateResumeUrl,
        extension,
      });
    } else {
      throw new Error("CV Not found");
    }
  } catch (error) {
    res.status(500).json({
      error,
    });
  }
};

const generatePasswordForCandidate = async (candidateId, jobId, round) => {
  try {
    const password = otpGenerator.generate(8, {
      digits: true,
      lowerCaseAlphabets: true,
      upperCaseAlphabets: true,
      specialChars: true,
    });
    const candidate = await Candidate.findOne({ _id: candidateId, jobId });

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

const getCandidates = async (req, res) => {
  const jobId = req.params.id;
  const { stage, status, searchQuery } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Base query to filter candidates by jobId
  const query = { jobId };

  if (status) {
    query.status = status;
  }
  if (stage) {
    query.stage = stage;
  }

  if (
    searchQuery &&
    searchQuery.trim().length > 0 &&
    searchQuery != "undefined"
  ) {
    query.$or = [];

    query.$or.push(
      { jobTitle: { $regex: searchQuery, $options: "i" } },
      { stage: { $regex: searchQuery, $options: "i" } },
      { status: { $regex: searchQuery, $options: "i" } },
      { "resume.full_name": { $regex: searchQuery, $options: "i" } },
      { "resume.total_work_experience": Number(searchQuery) }
    );
    const parsedDate = Date.parse(searchQuery);
    if (!isNaN(parsedDate)) {
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.$or.push({
        date: { $gte: startOfDay, $lte: endOfDay },
      });
      query.$or.push({
        interviewScheduledDate: { $gte: startOfDay, $lte: endOfDay },
      });
    }
  }

  try {
    const total = await Candidate.countDocuments(query);
    const candidates = await Candidate.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(201).json({
      candidates,
      total,
    });
  } catch (error) {
    res.status(401).json(error);
  }
};

const modifyCandidates = async (req, res) => {
  const status = req.query.status;
  const selectedIds = req.body.selectedIds;

  try {
    for (const id of selectedIds) {
      await Candidate.findOneAndUpdate({ _id: id }, { status: status });
    }

    res.status(201).json({
      message: "success",
    });
  } catch (error) {
    res.status(401).json({
      error,
      message: "failed",
    });
  }
};
const modifyCandidate = async (req, res) => {
  const status = req.query.status;
  const _id = req.params.id;

  try {
    await Candidate.findOneAndUpdate({ _id: _id }, { status: status });

    res.status(201).json({
      message: "success",
    });
  } catch (error) {
    res.status(401).json({
      error,
      message: "failed",
    });
  }
};

const dropCandidate = async (req, res) => {
  const _id = req.params.id;

  try {
    const candidate = await Candidate.findOne({ _id });

    const interviewRound = await InterviewRoundModel.findOne({
      jobId: candidate.jobId,
    });

    // both
    if (
      (interviewRound.selectedInterviewRound === "both" ||
        interviewRound.selectedInterviewRound === "coding-then-technical") &&
      !candidate.status === "shortlisted"
    ) {
      candidate.stageStatus = {
        ...candidate.stageStatus,
        interview: "-",
        coding: "-",
      };
      candidate.reason = {
        ...candidate.reason,
        interview: {
          score: 0,
          reason: {
            "Problem Solving": 0,
            Emotion: 0,
            "Soft Skills": 0,
            "Technical Skills": 0,
            "Interview Feedback": "Rejected by Employer",
          },
        },
        coding: {
          score: 0,
          reason: {
            "Problem Solving": 0,
            "Logical Thinking": 0,
            "Code Correctness": 0,
            "Code Complexity": 0,
            "Code Feedback": "Rejected by Employer",
          },
        },
      };
    }
    // only coding
    else if (
      interviewRound.selectedInterviewRound === "coding" &&
      !candidate.status === "shortlisted"
    ) {
      candidate.stageStatus = {
        ...candidate.stageStatus,
        coding: "-",
      };
      candidate.reason = {
        ...candidate.reason,

        coding: {
          score: 0,
          reason: {
            "Problem Solving": 0,
            "Logical Thinking": 0,
            "Code Correctness": 0,
            "Code Complexity": 0,
            "Code Feedback": "Rejected by Employer",
          },
        },
      };
    }
    // only technical
    else if (
      interviewRound.selectedInterviewRound === "technical" &&
      !candidate.status === "shortlisted"
    ) {
      candidate.stageStatus = {
        ...candidate.stageStatus,
        interview: "-",
      };
      candidate.reason = {
        ...candidate.reason,
        interview: {
          score: 0,
          reason: {
            "Problem Solving": 0,
            Emotion: 0,
            "Soft Skills": 0,
            "Technical Skills": 0,
            "Interview Feedback": "Rejected by Employer",
          },
        },
      };
    }
    candidate.status = "rejected";
    await candidate.save();
    res.json({
      message: "Candidate dropped successfully",
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

const sheduleInterviewRoute = async (req, res) => {
  const jobId = req.params.jobId;

  const _id = req.params.id;
  const stage = req.query.stage;
  const status = req.query.status;

  try {
    const interviewRound = await InterviewRoundModel.findOne({ jobId });

    if (interviewRound.selectedInterviewRound === "technical") {
      const candidate = await Candidate.findOne({ _id });
      const user = await User.findOne({ _id: candidate.userId });
      if (candidate.stageStatus.screening === "completed") {
        candidate.stage = stage;
        candidate.status = status;
        candidate.interviewScheduledDate = Date.now();

        const now = Date.now();
        const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
        candidate.interviewEndDate = new Date(now + fiveDaysInMilliseconds);

        candidate.stageStatus = {
          ...candidate.stageStatus,
          interview: "ongoing",
        };

        const password = await generatePasswordForCandidate(
          _id,
          jobId,
          "technical"
        );

        transport.sendMail(
          sheduleInterview(
            candidate.resume.email_address,
            candidate.resume.full_name,
            jobId,
            _id,
            password,
            user.username,
            user.companyName
          ),
          async (error, info) => {
            if (error) {
              throw new Error(error);
            } else {
              await candidate.save();
              console.log("Email Sent");
            }
          }
        );
      }
    }

    if (interviewRound.selectedInterviewRound === "coding") {
      const candidate = await Candidate.findOne({ _id });
      const user = await User.findOne({ _id: candidate.userId });
      if (candidate.stageStatus.screening === "completed") {
        candidate.stage = "coding";
        candidate.status = status;
        candidate.interviewScheduledDate = Date.now();

        const now = Date.now();
        const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
        candidate.interviewEndDate = new Date(now + fiveDaysInMilliseconds);

        candidate.stageStatus = {
          ...candidate.stageStatus,
          coding: "ongoing",
        };

        const password = await generatePasswordForCandidate(
          _id,
          jobId,
          "coding"
        );

        transport.sendMail(
          scheduleCoding(
            candidate.resume.email_address,
            candidate.resume.full_name,
            jobId,
            _id,
            password,
            user.username,
            user.companyName
          ),
          (error, info) => {
            if (error) {
              throw new Error(error);
            }
          }
        );
        await candidate.save();
      }
    }

    if (interviewRound.selectedInterviewRound === "both") {
      const candidate = await Candidate.findOne({ _id });
      const user = await User.findOne({ _id: candidate.userId });
      if (candidate.stageStatus.screening === "completed") {
        candidate.stage = stage;
        candidate.status = status;
        candidate.interviewScheduledDate = Date.now();

        const now = Date.now();
        const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
        candidate.interviewEndDate = new Date(now + fiveDaysInMilliseconds);

        candidate.stageStatus = {
          ...candidate.stageStatus,
          interview: "ongoing",
          coding: "to be started",
        };

        const password = await generatePasswordForCandidate(
          _id,
          jobId,
          "technical"
        );

        transport.sendMail(
          sheduleInterview(
            candidate.resume.email_address,
            candidate.resume.full_name,
            jobId,
            _id,
            password,
            user.username,
            user.companyName
          ),
          (error, info) => {
            if (error) {
              throw new Error(error);
            }
          }
        );
        await candidate.save();
      }
    }

    // coding then technical
    if (interviewRound.selectedInterviewRound === "coding-then-technical") {
      const candidate = await Candidate.findOne({ _id });
      const user = await User.findOne({ _id: candidate.userId });
      if (candidate.stageStatus.screening === "completed") {
        candidate.stage = "coding";
        candidate.status = status;
        candidate.interviewScheduledDate = Date.now();

        const now = Date.now();
        const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
        candidate.interviewEndDate = new Date(now + fiveDaysInMilliseconds);

        candidate.stageStatus = {
          ...candidate.stageStatus,
          coding: "ongoing",
          interview: "to be started",
        };

        const password = await generatePasswordForCandidate(
          _id,
          jobId,
          "coding"
        );

        transport.sendMail(
          scheduleCoding(
            candidate.resume.email_address,
            candidate.resume.full_name,
            jobId,
            _id,
            password,
            user.username,
            user.companyName
          ),
          (error, info) => {
            if (error) {
              throw new Error(error);
            }
          }
        );
        await candidate.save();
      }
    }

    res.status(201).json({
      messsage: "email sent successfully",
      success: true,
    });
  } catch (error) {
    res.status(401).json({ error });
  }
};

const scheduleFromRejected = async (req, res) => {
  const _id = req.params.id;

  try {
    const candidate = await Candidate.findOne({ _id });
    candidate.status = "selected";
    candidate.stage = "screening";

    await candidate.save();
    res.json({
      message: "Candidate moved to unscheduled successfully",
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

const getInterviewDetails = async (req, res) => {
  const jobId = req.params.jobId;
  const _id = req.params.id;
  try {
    const candidate = await Candidate.findOne({ _id });
    const job = await Job.findOne({ _id: jobId });
    const interviewPreference = await Prefernce.find({ jobId });

    res.status(201).json({
      jobDescription: job.jobDescription,
      resume: candidate.resume,
      interviewPreference,
    });
  } catch (error) {
    res.status(401).json({
      error,
    });
  }
};

const getCandidatesCount = async (req, res) => {
  const jobId = req.params.jobId;

  try {
    const response = await Candidate.find({ jobId });

    res.status(201).json(response.length);
  } catch (error) {
    res.status(401).status(error);
  }
};

// const getAllCandidates = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const uniqueCandidates = await Candidate.aggregate([
//       {
//         $match: { userId: userId },
//       },
//       {
//         $group: {
//           _id: "$resume.email_address",
//           fullName: { $first: "$resume.full_name" },
//           phoneNumber: { $first: "$resume.phone_number" },
//           jobsApplied: { $push: "$jobId" },
//         },
//       },
//     ]);

//     res.json(uniqueCandidates);
//   } catch (error) {
//     res.json(error);
//   }
// };

const getAllCandidates = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const totalCandidates = await Candidate.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: "$resume.email_address",
        },
      },
    ]);

    const total = totalCandidates.length;

    const uniqueCandidates = await Candidate.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: "$resume.email_address",
          fullName: { $first: "$resume.full_name" },
          phoneNumber: { $first: "$resume.phone_number" },
          jobsApplied: { $push: "$jobId" },
        },
      },
      { $sort: { fullName: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    res.json({
      data: uniqueCandidates,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function getJobsByEmail(req, res) {
  try {
    const { jobIds, email } = req.query;

    if (!jobIds || !email) {
      return res.status(400).json({ error: "jobIds and email are required" });
    }

    // Parse jobIds into an array if it's not already
    const jobIdsArray = Array.isArray(jobIds) ? jobIds : jobIds.split(",");

    const candidates = await Candidate.find({
      "resume.email_address": email,
      jobId: { $in: jobIdsArray },
    });

    res.status(200).json(candidates);
  } catch (err) {
    res.json(err);
    console.error(err);
  }
}

routes.get("/get-jobs-candidates/", getJobsByEmail);
routes.get("/get-all-candidates/:userId", getAllCandidates);

routes.get("/get-candidates/:id", getCandidates);

routes.post("/shedule-interview-candidate/:jobId/:id", sheduleInterviewRoute);
routes.post("/drop-interview-candidate/:id", dropCandidate);

routes.post("/schedule-from-rejected/:id", scheduleFromRejected);
routes.get("/get-interview-details/:jobId/:id", getInterviewDetails);
routes.put("/modify-candidates", modifyCandidates);
routes.put("/change-candidate/:id", modifyCandidate);

routes.get("/get-candidates-count/:jobId", getCandidatesCount);

routes.get("/get-candidate-cv/:candidateId", getCandidateCV);

module.exports = routes;
