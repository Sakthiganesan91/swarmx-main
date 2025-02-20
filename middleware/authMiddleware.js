const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Candidate = require("../models/candidateModal");
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.SECRET_KEY);

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(403).json({ message: "Auth Token Required" });
  }
  if (authorization.split(" ")[0] === "Candidate") {
    const _id = authorization.split(" ")[1];
    try {
      const candidate = await Candidate.findOne({ _id });

      if (candidate) {
        next();
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(403).json({ message: "Not Authorized" });
    }
  } else {
    const jwtToken = authorization.split(" ")[1];
    const token = cryptr.decrypt(jwtToken)

    try {
      const { _id } = jwt.verify(token, process.env.SECRET_KEY);
      req.user = await User.findOne({ _id }).select("_id");
      next();
    } catch (error) {
      res.status(403).json({ message: "Not Authorized" });
    }
  }

};
module.exports = requireAuth;
