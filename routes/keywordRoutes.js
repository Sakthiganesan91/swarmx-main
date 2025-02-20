const express = require("express");
const keywordController = require("../controller/keywordController");

const routes = express.Router();

routes.get("/get-keywords", keywordController.getKeywords);
routes.post("/post-keyword", keywordController.addKeyword);

module.exports = routes;
