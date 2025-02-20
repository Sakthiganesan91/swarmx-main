const express = require("express");
const axios = require("axios");
const qs = require("qs");
const routes = express.Router();
const { v4: uuidv4 } = require("uuid");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");

const { Client } = require("@microsoft/microsoft-graph-client");

const FreeSlots = require("../models/freeSlots.model");
const Candidate = require("../models/candidateModal");
const BookedSlots = require("../models/bookedSlots.model");
const JobModel = require("../models/jobModel");
const UserModel = require("../models/userModel");

const { findAvailableInterviewer } = require("../helpers/findFreeSlot");

const { getFreeSlotsForAll } = require("../helpers/timeCalculation");
const {
  sendSlotScheduleMailToCandidate,
  sendConfirmSlotScheduleMailToInterviewer,
} = require("../helpers/emailTemplates");
const { transport } = require("../config/mailerTransport");

const generatePasswordForInterviewer = async (candidateId, email) => {
  try {
    const password = otpGenerator.generate(8, {
      digits: true,
      lowerCaseAlphabets: true,
      upperCaseAlphabets: true,
      specialChars: true,
    });
    const bookedSlot = await BookedSlots.findOne({ candidateId });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    bookedSlot.authentication = {
      ...bookedSlot.authentication,
      password: hashedPassword,
    };

    await bookedSlot.save();

    return password;
  } catch (error) {
    throw error;
  }
};

function convertToDateTime(isoString) {
  const date = new Date(isoString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };
  return date.toLocaleString("en-US", options);
}

const scheduleEmail = async (
  email,
  startTime,
  endTime,
  candidateId,
  meetingLink
) => {
  const password = await generatePasswordForInterviewer(candidateId, email);
  const start = convertToDateTime(startTime);
  const end = convertToDateTime(endTime);

  return sendConfirmSlotScheduleMailToInterviewer(
    email,
    start,
    end,
    meetingLink,
    candidateId,
    password
  );
};

routes.post("/api/available-times", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  //   const { attendees, timeSlots, duration } = req.body;

  const {
    jobId,
    candidateId,
    interviewerEmail,
    schedules,
    startTime,
    endTime,
    workTimeStart,
    workTimeEnd,
    availabilityViewInterval,
  } = req.body;

  const client = Client.init({
    authProvider: (done) => done(null, token),
  });

  try {
    // store interview information
    const candidate = await Candidate.findOne({ _id: candidateId });
    const email = candidate.resume.email_address[0];

    await FreeSlots.create({
      jobId: jobId,
      candidateId: candidateId,
      interviewerEmail: interviewerEmail,
      email: email,
      startTime: startTime,
      endTime: endTime,
      workTimeStart: workTimeStart,
      workTimeEnd: workTimeEnd,
      schedules: schedules,
      duration: availabilityViewInterval,
      // interviewers: freeSlots
    });

    transport.sendMail(
      sendSlotScheduleMailToCandidate(email, candidateId),
      (error, info) => {
        if (error) {
          throw new Error(error);
        } else {
          console.log("Sent Mail");
          res.json({
            message: "Email sent successfully",
            success: true,
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving available times");
  }
});

routes.post("/get-availableslots/:candidateId", async (req, res) => {
  const candidateId = req.params.candidateId;

  // access token
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  const scope = "https://graph.microsoft.com/.default";
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const data = qs.stringify({
    client_id: clientId,
    scope: scope,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const token = response.data.access_token;

    // freeslots
    const freeSlot = await FreeSlots.findOne({ candidateId });

    const client = Client.init({
      authProvider: (done) => done(null, token),
    });

    const userId = freeSlot.interviewerEmail;
    const result = await client
      .api(
        `https://graph.microsoft.com/v1.0/users/${userId}/calendar/getSchedule`
      )
      .post({
        schedules: freeSlot.schedules,
        startTime: freeSlot.startTime,
        endTime: freeSlot.endTime,
        availabilityViewInterval: freeSlot.duration,
      });
    //   Job Details
    const job = await JobModel.findOne({ _id: freeSlot.jobId });

    const user = await UserModel.findOne({ _id: job.userId });

    // Work Timing
    const workTimeStart = freeSlot.workTimeStart;
    const workTimeEnd = freeSlot.workTimeEnd;
    const freeSlots = getFreeSlotsForAll(
      result,
      freeSlot.startTime,
      freeSlot.endTime,
      freeSlot.duration
    );

    res.json({
      message: "Free slots retrieved",
      freeSlots: freeSlots,
      workTimeStart: workTimeStart,
      workTimeEnd: workTimeEnd,
      jobDetails: job,
      companyName: user.companyName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error Retrieving Free Slots");
  }
});

const extractTimeZone = (dateTimeString) => {
  const regex = /([+-]\d{2}:\d{2}|Z)$/; // Regex to match timezone offset or 'Z' for UTC
  const match = dateTimeString.match(regex);
  return match ? match[0] : "UTC"; // Default to "UTC" if no timezone is found
};

routes.post("/store-bookedslot", async (req, res) => {
  const startTime = req.body.startTime;
  const endTime = req.body.endTime;
  const candidateId = req.body.candidateId;
  const interviewerEmail = req.body.interviewerEmail;

  const freeSlot = await FreeSlots.findOne({ candidateId });
  const employerEmail = freeSlot.interviewerEmail;

  const candidate = await Candidate.findOne({ _id: candidateId });
  // access token
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  const scope = "https://graph.microsoft.com/.default";
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const data = qs.stringify({
    client_id: clientId,
    scope: scope,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const token = response.data.access_token;

    const transactionId = uuidv4();
    const calendarEventData = {
      subject: "Interview Scheduled",
      body: {
        contentType: "HTML",
        content: `Interview scheduled.<br> Please find the details below. <br>Candidate : ${candidate.resume.full_name[0]} <br> Job Title : ${candidate.jobTitle}`,
      },
      start: {
        dateTime: startTime,
        timeZone: extractTimeZone(startTime),
      },
      end: {
        dateTime: endTime,
        timeZone: extractTimeZone(endTime),
      },

      attendees: [
        {
          emailAddress: {
            address: interviewerEmail,
          },
          type: "required",
        },
      ],
      transactionId: transactionId,
      showAs: "tentative",
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness",
    };

    const results = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${employerEmail}/calendar/events`,
      calendarEventData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const meetingLink = results.data.onlineMeeting.joinUrl;
    // Store booked details
    await BookedSlots.create({
      candidateId: candidateId,
      startTime: startTime,
      endTime: endTime,
      interviewerEmail: interviewerEmail,
      meetId: results.data.id,
    });

    transport.sendMail(
      await scheduleEmail(
        interviewerEmail,
        startTime,
        endTime,
        candidateId,
        meetingLink
      ),
      (error, info) => {
        if (error) {
          throw new Error(error);
        } else {
          res.json({
            message: "Email sent successfully",
            success: true,
          });
        }
      }
    );
  } catch (error) {
    console.error("Error Storing Booked Slots:", error.message);
  }
});

// retrieving booked slot details
routes.post("/get-booked-details/:candidateId/:email", async (req, res) => {
  const candidateId = req.params.candidateId;
  const email = req.params.email;

  try {
    const bookedSlot = await BookedSlots.findOne({
      candidateId: candidateId,
      interviewerEmail: email,
    });

    res.status(201).json(bookedSlot);
  } catch (error) {
    res.status(400).json(error);
  }
});

routes.post("/check-existingslot/:candidateId", async (req, res) => {
  const candidateId = req.params.candidateId;

  try {
    const existingSlot = await BookedSlots.findOne({
      candidateId: candidateId,
    });
    if (existingSlot) {
      res.status(201).json({
        success: true,
        existingSlot: existingSlot,
      });
    } else {
      res.status(201).json({
        success: false,
      });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

module.exports = routes;

// routes.post("/find-freeslot", async (req, res) => {
//     dateTime = req.body.dateTime;

//     //use candidate id to retrieve the freeslot for that candidate ---> to be implemented

//     const freeSlot = await FreeSlots.findOne({ _id: "66ffdf63be528c45beaebfa9" });

//     //function to check
//     const availableInterviewer = findAvailableInterviewer(
//         dateTime,
//         freeSlot.duration,
//         freeSlot.interviewers
//     );

//     if (availableInterviewer) {
//
//             .send(getMessage(availableInterviewer))
//             .then(() => {
//                 res.json({
//                     message: "Interview Has been scheduled successfully",
//                     success: true,
//                 });
//             })
//             .catch((error) => {
//                 throw new Error(error);
//             });
//     }
//     else {
//         res.json({
//             message: "No available interviewer",
//         })
//     }
// });

// async function getAccessToken() {
//     const tenantId = process.env.TENANT_ID;
//     const clientId = process.env.CLIENT_ID;
//     const clientSecret = process.env.CLIENT_SECRET;

//     const scope = 'https://graph.microsoft.com/.default';
//     const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

//     const data = qs.stringify({
//         client_id: clientId,
//         scope: scope,
//         client_secret: clientSecret,
//         grant_type: 'client_credentials',
//     });
//     try {
//         const response = await axios.post(tokenUrl, data, {
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//             },
//         });
//         return response.data;  // Return the token data
//     } catch (error) {
//         throw new Error(error.response?.data || 'Error fetching token');
//     }
// }
