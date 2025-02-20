const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema({
  linkedin: [{
    textValue: {
      type: String,
      required: true,
    },
  }],
  facebook: [{
    textValue: {
      type: String,
      required: true,
    },
  }],
  instagram: [{
    textValue: {
      type: String,
      required: true,
    },
  }],
  twitter: [{
    textValue: {
      type: String,
      required: true,
    },
  }],
  youtube: [{
    textValue: {
      type: String,
      required: true,
    },
  }],
});

const socialLinkModel = mongoose.model('SocialLink', socialLinkSchema);

module.exports = socialLinkModel;
