const express = require("express");
const bulkUploadController = require("../controller/bulkUploadController");
const requireAuth = require("../middleware/authMiddleware");
const routes = express.Router();

routes.use(requireAuth);

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "application/msword" ||
      file.mimetype ==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype == "application/pdf"
    ) {
      cb(null, true);
    } else {
      return cb(new Error("Invalid File type"));
    }
  },
});

// routes.get("/get-files");
// routes.get("/get-files/:id");
routes.post("/initiate-add-files", bulkUploadController.initiateAddFiles);
routes.post(
  "/add-files/:jobId",
  upload.single("file"),
  bulkUploadController.addFiles
);

module.exports = routes; 
