const express = require("express");
const authController = require("../controller/authController");
const bcrypt = require("bcrypt");
const Otp = require("../models/OtpModel");
const User = require("../models/userModel");
const Company = require("../models/companyModel");

const routes = express.Router();
const otpGenerator = require("otp-generator");
const {
  otpEmail,
  otpEmailResetPassword,
} = require("../helpers/emailTemplates");
const { transport } = require("../config/mailerTransport");

const sendOtp = async (req, res) => {
  const email = req.query.email;
  const username = req.query.username?.toLowerCase();
  const u = req.body;

  try {
    const companyName = u.companyName?.toLowerCase(); // Safely access companyName
    const existingUser = await User.findOne({ email });
    const existingCompany = await User.findOne({ companyName });
    const existingUserName = await User.findOne({ username });
    if (existingUser || existingCompany || existingUserName) {
      throw Error("User or Company Already Exists");
    }

    const otp = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const duration = Date.now() + 120000;

    const user = await Otp.findOne({ email });
    if (user) {
      user.otp = otp;
      user.duration = duration;
      await user.save();
    } else {
      await Otp.create({ email, otp, duration: Date.now() + 120000, user: u });
    }

    transport.sendMail(otpEmail(email, username, otp), (error, info) => {
      if (error) {
        throw new Error(error);
      } else {
        res.json({
          message: "Email sent successfully",
          success: true,
        });
      }
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

const otpVerification = async (req, res) => {
  const otp = req.body.otp;
  const email = req.body.email;

  try {
    const user = await Otp.findOne({ email });
    if (!user) {
      res.status(400).json({
        message: `Invalid`,
      });
      return;
    }
    const {
      username,

      password,
      companyName,
      address,
      phoneNumber,
      pincode,
      city,
      state,
      country,
    } = user.user;
    const userOtp = user.otp;
    const time = user.duration;

    if (parseInt(userOtp) === parseInt(otp) && Date.now() < time) {
      const newuser = await User.signup(
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
      );
      // company name
      const company = await Company.create({
        company: companyName,
        userId: newuser._id,
      });

      await Otp.deleteOne({ email });

      res.status(201).json({
        message: "OTP Verified successfully & Account created Successfully",
        success: true,
      });
    } else {
      throw new Error("Invalid OTP");
    }
  } catch (error) {
    res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

const sendOtpForResetPassword = async (req, res) => {
  const email = req.query.email;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      throw Error("Email does not exist");
    }

    const otp = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const duration = Date.now() + 120000;

    const user = await Otp.findOne({ email });
    if (user) {
      user.otp = otp;
      user.duration = duration;
      await user.save();
    } else {
      await Otp.create({ email, otp, duration: Date.now() + 120000 });
    }

    transport.sendMail(otpEmailResetPassword(email, otp), (error, info) => {
      if (error) {
        throw new Error(error);
      } else {
        res.json({
          message: "Email sent successfully",
          success: true,
        });
      }
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

const otpVerificationResetPassword = async (req, res) => {
  const otp = req.body.otp;
  const email = req.body.email;

  try {
    const user = await Otp.findOne({ email });
    if (!user) {
      res.status(400).json({
        message: `Invalid OTP/Email`,
      });
      return;
    }
    const userOtp = user.otp;
    const time = user.duration;

    if (parseInt(userOtp) === parseInt(otp) && Date.now() < time) {
      await Otp.deleteOne({ email });

      res.status(201).json({
        message: "OTP Verified successfully ",
        success: true,
      });
    } else {
      throw new Error("Invalid OTP");
    }
  } catch (error) {
    res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

const resetPassword = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    if (!email) {
      throw Error("Invalid Email");
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw Error("Email does not exist");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    existingUser.password = hashedPassword;
    await existingUser.save();
    res.status(201).json({
      message: "Password reset successfully ",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
      success: false,
    });
  }
};

routes.post("/login", authController.login);
routes.post("/signup", authController.signup);
routes.post("/get-otp", sendOtp);

routes.post("/reset-password-otp", sendOtpForResetPassword);

routes.post("/reset-password-otp/verify", otpVerificationResetPassword);

routes.post("/otp-verify", otpVerification);

routes.post("/reset-password", resetPassword);
module.exports = routes;
