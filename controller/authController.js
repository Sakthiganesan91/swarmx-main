const User = require("../models/userModel");
const Company = require("../models/companyModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Cryptr = require("cryptr");
const { transport } = require("../config/mailerTransport");
const cryptr = new Cryptr(process.env.SECRET_KEY);

const createToken = (_id) => {
  return jwt.sign({ _id: _id }, process.env.SECRET_KEY, {
    expiresIn: "2d",
  });
};

const login = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await User.login(email, password);

    let isFirstTime = false;
    if (user.isFirstTimeLogin) {
      user.isFirstTimeLogin = false;
      await user.save();
      isFirstTime = true;
      const jwtToken = createToken(user._id);
      const token = cryptr.encrypt(jwtToken);
      return res.status(200).json({ id: user._id, token, user, isFirstTime });
    }

    const jwtToken = createToken(user._id);
    const token = cryptr.encrypt(jwtToken);

    res.status(200).json({ id: user._id, token, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const signup = async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const companyName = req.body.companyName;
  const address = req.body.address;
  const phoneNumber = req.body.phoneNumber;
  const city = req.body.city;
  const state = req.body.state;
  const pincode = req.body.pincode;
  const country = req.body.country;

  try {
    const user = await User.signup(
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

    const token = createToken(user._id);

    // company name
    const company = await Company.create({
      company: companyName,
      userId: user._id,
    });

    res.status(200).json({ id: user._id, token, user });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

module.exports = {
  signup,
  login,
};
