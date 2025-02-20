const Job = require("../models/jobModel");
const Preferences = require("../models/JobPreference");

// const getJob = async (req, res) => {
//   const userId = req.user._id;
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;

//   console.log(page, limit);

//   try {
//     const total = await Job.countDocuments({ userId });

//     const jobs = await Job.find({ userId })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     res.json({
//       data: jobs,
//       total,
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: error.message,
//     });
//   }
// };
const getJob = async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const total = await Job.countDocuments({ userId });

    const jobs = await Job.find({ userId })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ data: jobs, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getJobById = async (req, res) => {
  const _id = req.params.id;

  try {
    const job = await Job.findOne({ _id });

    res.json(job);
  } catch (error) {
    res.status(401).json({
      error,
    });
  }
};

const addJob = async (req, res) => {
  const userId = req.user._id;
  const {
    jobTitle,
    tags,
    minimumSalary,
    maximumSalary,
    currencyval,
    education,
    experience,
    vacancies,
    jobBenefits,
    jobDescription,
    expDate,
    designation,
    jobRole,
    workMode,
    pincode,
    city,
    state,
    country,
  } = req.body;

  try {
    const job = await Job.create({
      jobTitle,
      tags,
      minimumSalary,
      maximumSalary,
      currencyval,
      education,
      experience,
      vacancies,
      jobBenefits,
      jobDescription,
      userId,
      expDate,
      designation,
      jobRole,
      workMode,
      pincode,
      state,
      country,
      city,
    });

    res.status(201).json({
      message: "Job created successfully",
      success: true,
      job: job,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
      success: false,
    });
  }
};

const updateJob = async (req, res) => {
  const userId = req.user._id;
  const _id = req.params.id;

  const {
    jobTitle,
    tags,
    minimumSalary,
    maximumSalary,
    currencyval,
    education,
    experience,
    vacancies,
    jobBenefits,
    jobDescription,
    expDate,
    designation,
    jobRole,
    workMode,
    pincode,
    city,
    state,
    country,
  } = req.body;
  try {
    const job = await Job.findOne({ _id });

    if (!job) {
      throw new Error("job not found");
    }

    await Job.findOneAndUpdate(
      { _id },
      {
        jobTitle,
        tags,
        minimumSalary,
        maximumSalary,
        education,
        experience,
        vacancies,
        country,
        city,
        expDate,
        designation,
        jobRole,
        workMode,
        pincode,
        jobBenefits,
        jobDescription,
        state,
        currencyval,
      }
    );

    res.status(201).json({
      message: "job updated successfully",
      success: true,
    });
  } catch (error) {
    res.status(401).json({
      error: error.message,
    });
  }
};

const deleteJob = async (req, res) => {
  const _id = req.params.id;

  try {
    const job = await Job.findOne({ _id });

    if (!job) {
      throw new Error("job not found");
    }
    await Job.findOneAndDelete({ _id });

    res.status(201).json({
      message: "job deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(401).json({
      error: error.message,
    });
  }
};

const expireJob = async (req, res) => {
  const userId = req.user._id;
  const _id = req.params.id;

  try {
    const job = await Job.findOne({ _id });
    job.expDate = new Date() - 1;
    await job.save();
    res.status(201).json({
      message: "Success",
    });
  } catch (error) {
    res.status(401).json({
      error: error.message,
    });
  }
};

const getKeywordByJobId = async (req, res) => {
  const userId = req.user._id;
  const _id = req.params.id;
  try {
    const preferences = await Preferences.find({ jobId: _id });
    if (preferences.length > 0) {
      res.json(preferences);
    } else {
      const keywords = await Job.findOne({ _id }, "tags");
      res.json(keywords);
    }
  } catch (error) {
    res.status(401).json({
      error,
    });
  }
};

module.exports = {
  getJob,
  addJob,
  getJobById,
  deleteJob,
  updateJob,
  getKeywordByJobId,
  expireJob,
};
