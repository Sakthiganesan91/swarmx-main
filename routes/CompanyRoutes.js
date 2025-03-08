const express = require("express");
const companyController = require("../controller/companyController");
//const requireAuth = require("../middleware/authMiddleware");
const routes = express.Router();

routes.get("/get-companies", companyController.getCompanies);
routes.get("/get-job-companies/:id", companyController.getJobForCompanies);
routes.post("/post_job-admin/:id", companyController.addJobByAdmin);

module.exports = routes;
