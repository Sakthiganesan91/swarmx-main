const Keyword = require("../models/JobPreference");
const SubKeyword = require("../models/SubKeywordModel");
const Job = require("../models/jobModel");
const KeywordModel = require("../models/keywordModel");

exports.savePreference = async (req, res) => {
  try {
    const { tags, jobId, userId } = req.body;

    for (const tag of tags) {
      // Check if keyword already exists for the jobId and userId
      const existingKeyword = await Keyword.findOne({
        jobId: jobId,
        name: tag.name,
      });
      if (existingKeyword) {
        // If keyword exists, update the details
        existingKeyword.percentage = tag.percentage;
        existingKeyword.subKeywords = tag.subTags.map((subTag) => ({
          name: subTag.name,
          percentage: subTag.percentage,
        }));
        await existingKeyword.save();
      } else {
        await KeywordModel.create({
          keyword: tag.name,
          label: tag.name,
          value: tag.name,
        });
        // If keyword doesn't exist, add new keyword details

        const job = await Job.findOne({ _id: jobId });
        job.tags = [...job.tags, tag.name];

        await job.save();
        const keyword = new Keyword({
          jobId: jobId,

          name: tag.name,
          percentage: tag.percentage,
          subKeywords: tag.subTags.map((subTag) => ({
            name: subTag.name,
            percentage: subTag.percentage,
          })),
        });
        await keyword.save();
      }
      // Check and save new sub keywords
      for (const subTag of tag.subTags) {
        if (subTag.isNew) {
          const sub = new SubKeyword({
            label: subTag.name.toLowerCase(),
            value: subTag.name.toLowerCase(),
          });
          await sub.save();
        }
      }
    }

    res.status(200).json({ message: "Preference saved successfully" });
  } catch (error) {
    console.error("Error saving preference:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getSubKeyword = async (req, res) => {
  try {
    const subKeywords = await SubKeyword.find({});
    res.status(201).json({
      subKeywords,
    });
  } catch (error) {
    res.status(401).json({
      error,
    });
  }
};
exports.createKeyword = async (req, res) => {
  try {
    const { jobId, name } = req.body;
    const keyword = new Keyword({ jobId, name });
    await keyword.save();
    res.status(201).json(keyword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createSubKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, percentage } = req.body;
    const keyword = await Keyword.findById(id);
    if (!keyword) {
      return res.status(404).json({ error: "Keyword not found" });
    }
    const subKeyword = {
      name,
      percentage,
      keywordId: keyword._id,
      keywordName: keyword.name,
    };
    keyword.subKeywords.push(subKeyword);
    await keyword.save();
    res.status(201).json(keyword);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    await Keyword.findByIdAndDelete(id);
    res.status(200).json({ message: "Keyword deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteSubKeyword = async (req, res) => {
  try {
    const { id, subId } = req.params;
    const keyword = await Keyword.findById(id);
    keyword.subKeywords.pull(subId);
    await keyword.save();
    res.status(200).json({ message: "SubKeyword deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
