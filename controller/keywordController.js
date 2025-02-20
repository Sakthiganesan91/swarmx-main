const Keyword = require("../models/keywordModel");

const getKeywords = async (req, res) => {
  try {
    const keywords = await Keyword.find({});

    res.status(201).json({
      keywords,
    });
  } catch (error) {
    res.status(402).json({
      error,
    });
  }
};

const addKeyword = async (req, res) => {
  const keyword = req.body.keyword;
  const label = req.body.label;
  const value = req.body.value;
  try {
    await Keyword.create({
      keyword,
      label,
      value,
    });

    res.status(201).json({
      message: "keyword added",
    });
  } catch (error) {
    res.status(402).json({
      error,
    });
  }
};

module.exports = {
  getKeywords,
  addKeyword,
};
