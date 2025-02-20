const { transport } = require("../config/mailerTransport");
const { otpEmail } = require("../helpers/emailTemplates");
const Otp = require("../models/OtpModel");

const sendOtp = async (req, res) => {
  const email = req.query.email;
  const username = req.query.username;
  try {
    const otp = otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });

    await Otp.create({ email, otp, duration: Date.now() + 120000 });

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

    const userOtp = user.otp;
    const time = user.duration;

    if (userOtp === parseInt(otp) && Date.now() < time) {
      res.status(201).json({
        message: "OTP Verified successfully",
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

module.exports = {
  sendOtp,
  otpVerification,
};
