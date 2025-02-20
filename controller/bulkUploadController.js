const BulkUpload = require("../models/uploadedFilesModel");
const Jobs = require("../models/jobModel")
const azure = require("../config/azureStorage");
const { v4: uuidv4 } = require("uuid");

const addFiles = async (req, res) => {
  const file = req.file;
  const jobId = req.params.jobId;
  try {
    const uploadedFile = await BulkUpload.findOne({ jobId });

    const job = await Jobs.findOne({ _id: jobId });
    const userId = job.userId.toString();

    const fileName = `${uuidv4()}__${jobId}__${userId}__${file.originalname}`;
    const fileUrl = await azure.azureStore(fileName, file.buffer);

    uploadedFile.files.push({
      fileUrl,
      fileName: file.originalname,
    });

    await uploadedFile.save();

    res.status(201).json({
      message: "Success",
      status: true,
    });
  } catch (error) { }
};

const initiateAddFiles = async (req, res) => {
  const userId = req.user._id;
  const jobId = req.body.jobId;
  const source = req.body.source;

  try {
    const existingUploadedFiles = await BulkUpload.findOne({ jobId });

    if (!existingUploadedFiles) {
      await BulkUpload.create({
        source,
        jobId,
        userId,
      });
    }

    res.json({
      message: true,
    });
  } catch (error) {
    res.status(408).json({ error, message: false });
  }
};

module.exports = {
  initiateAddFiles,
  addFiles,
};

/**Old Logic -Uploading all files at once
 * 
 * 
 *  const uploadPromises = files.map(async (file) => {
      const fileName = `${uuidv4()} ${file.originalname}`;
      const fileUrl = await azure.azureStore(fileName, file.buffer);

      uploadedFiles.files.push({
        fileUrl,
        fileName: file.originalname,
      });
    });

    await Promise.all(uploadPromises);

    await uploadedFiles.save();
*/
