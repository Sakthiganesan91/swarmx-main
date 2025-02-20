const Company = require("../models/companyModel");
const Job = require("../models/jobModel");
const User = require("../models/userModel");

const getCompanies = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const total = await Company.countDocuments({});
    const companies = await Company.find({})
      .skip((page - 1) * limit)
      .limit(limit);
    const results = await Promise.all(
      companies.map(async (company) => {
        try {
          const jobs = await Job.find({ userId: company.userId });
          const user = await User.findOne({ _id: company.userId });

          if (!user) {
            return {
              userId: company.userId,
              companyName: "Unknown",
              jobLength: jobs.length,
              email: "Unknown",
              location: "Unknown",
            };
          }
          return {
            userId: company.userId || "Unknown",
            companyName: user.companyName || "Unknown",
            jobLength: jobs.length,
            email: user.email || "Unknown",
            location: user.city || "Unknown",
          };
        } catch (innerError) {
          console.error("Error processing company:", innerError);
          return {
            userId: undefined,
            companyName: "Error",
            jobLength: 0,
            email: "Error",
            location: "Error",
          };
        }
      })
    );

    res.status(200).json({ companies: results, total });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getJobForCompanies = async (req, res) => {
  const userId = req.params.id;

  try {
    const jobs = await Job.find({ userId });

    res.json(jobs);
  } catch (error) {
    res.status(401).json({
      error: error,
    });
  }
};

const addJobByAdmin = async (req, res) => {
  const userId = req.params.id;
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

module.exports = {
  getCompanies,
  getJobForCompanies,
  addJobByAdmin,
};
