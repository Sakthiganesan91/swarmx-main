const mongoose = require('mongoose');

const SubKeywordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  keywordId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the parent keyword
    ref: 'JobPreference'
  },
  keywordName: String // Name of the parenat keyword
});

const KeywordSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  subKeywords: [SubKeywordSchema]
});

module.exports = mongoose.model('JobPreference', KeywordSchema);
