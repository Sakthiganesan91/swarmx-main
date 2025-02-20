const express = require("express");
const sourceController = require("../controller/sourceController");

const routes = express.Router();

routes.get("/get-source", sourceController.getSource);
routes.post("/post-source", sourceController.addSource);

module.exports = routes;
