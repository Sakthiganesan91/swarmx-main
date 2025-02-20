const express = require("express");
const employersController = require("../controller/employersController");
const routes = express.Router();

routes.post("/employers-profile/employers-social-profile", employersController.addSocialProfile);


module.exports = routes;
