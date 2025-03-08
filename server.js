require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");

const path = require("path");
const companyRoutes = require("./routes/CompanyRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const keywordRoutes = require("./routes/keywordRoutes");
const jdRoutes = require("./routes/jdRoutes");
const employersRoutes = require("./routes/employersRoutes");
const getuser = require("./routes/getuser");
const jobPreferenceRoutes = require("./routes/jobPreferenceRoutes");
const sourceRoutes = require("./routes/sourceRoutes");
//const otpRoutes = require("./routes/otpRoutes");
const bulkUploadRoutes = require("./routes/bulkUploadRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const interviewRoundRoutes = require("./routes/interviewRoundRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const schedulerRoutes = require("./routes/schedulerRoutes");
const reschedulerRoutes = require("./routes/reschedulerRoutes");
const codingquestionRoutes = require("./routes/codingQuestionRoutes");
const { transport, mailOptions } = require("./config/mailerTransport");
const feedbackRoutes = require("./routes/feedback.routes");

// initialize
const app = express();

app.use(cors({}));

app.use(express.static(path.join(__dirname, "build")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(codingquestionRoutes);
app.use(schedulerRoutes);
app.use(reschedulerRoutes);

app.use(interviewRoutes);

app.use(authRoutes);

app.use("/job", jobRoutes);
app.use("/keyword", keywordRoutes);
app.use("/company", companyRoutes);
app.use(jdRoutes);
app.use("/employers", employersRoutes);
app.use(getuser);
app.use("/upload", bulkUploadRoutes);
app.use("/api", jobPreferenceRoutes);
app.use("/source", sourceRoutes);
app.use("/candidate", candidateRoutes);
app.use(interviewRoundRoutes);
app.use("/feedback", feedbackRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

mongoose
  .connect(process.env.MONGOOSE_CONNECTION_URI)
  .then(app.listen(process.env.PORT || 8080));
