const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      default: "Employer",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    companyName: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },

    aboutUs: {
      type: String,
      default: null,
    },

    logoImage: {
      type: String,
      default: null,
    },

    bannerImage: {
      type: String,
      default: null,
    },
    orgType: {
      type: String,
      default: null,
    },
    industry: {
      type: String,
      default: null,
    },
    teamSize: {
      type: String,
      default: null,
    },
    establishYear: {
      type: String,
      match: /^\d{4}-\d{2}-\d{2}$/, // Optional: You can add a regex pattern to enforce the format
      default: null,
    },
    website: {
      type: String,
      default: null,
    },
    vision: {
      type: String,
      default: null,
    },

    linkedin: {
      type: String,
      default: "",
    },
    facebook: {
      type: String,
      default: "",
    },
    instagram: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
    youtube: {
      type: String,
      default: "",
    },
    isFirstTimeLogin: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.statics.signup = async function (
  username,
  email,
  password,
  companyName,
  address,
  phoneNumber,
  pincode,
  city,
  state,
  country
) {
  username = username.toLowerCase();

  companyName = companyName.toLowerCase();
  const existingUser = await this.findOne({ email });
  const existingCompany = await this.findOne({ companyName });
  const existingUserName = await this.findOne({ username });
  if (existingUser || existingCompany || existingUserName) {
    throw Error("User or Company Already Exists");
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await this.create({
      username,
      email,
      password: hashedPassword,
      companyName,
      address,
      phoneNumber,
      pincode,
      city,
      state,
      country,
    });

    return user;
  }
};

userSchema.statics.login = async function (email, password) {
  const existingUser = await this.findOne({
    email,
  });

  if (!existingUser) {
    throw Error("user does not exist");
  }

  const match = await bcrypt.compare(password, existingUser.password);

  if (match) {
    return existingUser;
  } else {
    throw Error("Check Password and Try Again");
  }
};

module.exports = mongoose.model("user", userSchema);
