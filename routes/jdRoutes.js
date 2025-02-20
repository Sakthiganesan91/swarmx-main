const express = require("express");
const routes = express.Router();
const multer = require("multer");
const pdfParser = require("pdf-parse");
const pdfText = require("../models/pdfTextModel");
const DIR = "./public/";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, fileName);
  },
});

var fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Only .pdf format allowed!"));
  }
};
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
});

routes.post("/jd", pdfUpload.array("pdf", 10), async (req, res) => {
  const pdfFiles = req.files;

  try {
    for (const pdfFile of pdfFiles) {
      const dataBuffer = pdfFile.buffer;
      const data = await pdfParser(dataBuffer);

      await pdfText.create({
        text: data.text,
      });
    }

    res.status(201).json({
      message: "success",
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

routes.get("/get-jds", async (req, res) => {
  try {
    const jds = await pdfText.find({});

    // const jds = await pdfText.countDocuments({});

    res.status(201).json({
      jds: jds,
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

module.exports = routes;
