const nodemailer = require("nodemailer");
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_HOST_PORT,
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  auth: {
    user: process.env.SMTP_AUTH_EMAIL,
    pass: process.env.SMTP_AUTH_PASSWORD,
  },
  secure: false,
});

module.exports = {
  transport,
};
