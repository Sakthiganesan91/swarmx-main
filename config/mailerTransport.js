const nodemailer = require("nodemailer");
const transport = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  auth: {
    user: "support@swarmx.ai",
    pass: "b.Q6KnW^.f",
  },
  secure: false,
});

const mailOptions = {
  from: "support@swarmx.ai", // Sender address
  to: "sakthiganesan158@gmail.com", // List of recipients
  subject: "Test Email",
  text: "This is a test email from Nodemailer.",
  html: "<p>This is a <b>test email</b> from Nodemailer.</p>",
};
module.exports = {
  mailOptions,
  transport,
};
