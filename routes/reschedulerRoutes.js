const express = require("express");
const axios = require("axios");
const qs = require("qs");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const routes = express.Router();
const { v4: uuidv4 } = require("uuid");
const BookedSlots = require("../models/bookedSlots.model");
const FreeSlots = require("../models/freeSlots.model");
const Candidate = require("../models/candidateModal");
const {
  sendNotifyDeclinedMail,
  sendConfirmSlotScheduleMailToInterviewer,
  rescheduleEmailByCandidate,
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

const rescheduleEmail = (
  email,
  startTime,
  endTime,
  candidateId,
  meetingLink
) => {
  const start = convertToDateTime(startTime);
  const end = convertToDateTime(endTime);

  return rescheduleEmailByCandidate(
    email,
    start,
    end,
    meetingLink,
    candidateId
  );
};

const deleteCalendarEvent = async (
  candidateId,
  employerEmail,
  meetId,
  interviewerEmail
) => {
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

  const response = await axios.post(tokenUrl, data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const token = response.data.access_token;

  // delete meet
  await axios.delete(
    `https://graph.microsoft.com/v1.0/users/${employerEmail}/calendar/events/${meetId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

routes.delete("/decline-meet/:candidateId/:email", async (req, res) => {
  const candidateId = req.params.candidateId;
  const email = req.params.email;

  try {
    const bookedSlot = await BookedSlots.findOne({
      candidateId: candidateId,
      interviewerEmail: email,
    });

    const freeSlot = await FreeSlots.findOne({ candidateId });
    const employerEmail = freeSlot.interviewerEmail;
    const candidateEmail = freeSlot.email;
    deleteCalendarEvent(candidateId, employerEmail, bookedSlot.meetId, email);

    // delete booked slot in backend
    try {
      await BookedSlots.deleteOne({
        candidateId: candidateId,
        interviewerEmail: email,
      });
      console.log("Deleted Booked slot successfully");
    } catch (error) {
      throw error;
    }

    transport.sendMail(
      sendNotifyDeclinedMail(candidateEmail, candidateId),
      (error, info) => {
        if (error) {
          throw new Error(error);
        } else {
          res.json({
            message: "Slot Declined",
            success: true,
          });
        }
      }
    );
  } catch (error) {
    res.status(400).json({
      message: "Error in Declining Slots",
    });
  }
});

// Decline During reschedule
routes.delete(
  "/decline-meet-reschedule/:candidateId/:email",
  async (req, res) => {
    const candidateId = req.params.candidateId;
    const email = req.params.email;

    try {
      const bookedSlot = await BookedSlots.findOne({
        candidateId: candidateId,
        interviewerEmail: email,
      });

      const freeSlot = await FreeSlots.findOne({ candidateId });
      const employerEmail = freeSlot.interviewerEmail;
      deleteCalendarEvent(candidateId, employerEmail, bookedSlot.meetId, email);

      res.status(201).json({
        message: "Slot declined",
      });
    } catch (error) {
      res.status(400).json({
        message: "Error in Declining Slots",
      });
    }
  }
);

const extractTimeZone = (dateTimeString) => {
  const regex = /([+-]\d{2}:\d{2}|Z)$/; // Regex to match timezone offset or 'Z' for UTC
  const match = dateTimeString.match(regex);
  return match ? match[0] : "UTC"; // Default to "UTC" if no timezone is found
};

// Reschedule

routes.post("/reschedule-bookedslot", async (req, res) => {
  const startTime = req.body.startTime;
  const endTime = req.body.endTime;
  const candidateId = req.body.candidateId;
  const interviewerEmail = req.body.interviewerEmail;

  const freeSlot = await FreeSlots.findOne({ candidateId });
  const employerEmail = freeSlot.interviewerEmail;
  const candidateEmail = freeSlot.email;

  // access token
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  const scope = "https://graph.microsoft.com/.default";
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const candidate = await Candidate.findOne({ _id: candidateId });

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

    const meetLink = results.data.onlineMeeting.joinUrl;
    // Update booked slot
    await BookedSlots.updateOne({
      candidateId: candidateId,
      startTime: startTime,
      endTime: endTime,
      interviewerEmail: interviewerEmail,
      meetId: results.data.id,
    });

    transport.sendMail(
      rescheduleEmail(
        candidateEmail,
        startTime,
        endTime,
        candidateId,
        meetLink
      ),
      (error, info) => {
        if (error) {
          throw new Error(error);
        } else {
          res.json({
            message: "Slot Declined",
            success: true,
          });
        }
      }
    );
  } catch (error) {
    console.error("Error Updating Booked Slots:", error.message);
  }
});

// Update booked Slot by candidate
routes.post("/update-bookedslot", async (req, res) => {
  const startTime = req.body.startTime;
  const endTime = req.body.endTime;
  const candidateId = req.body.candidateId;
  const interviewerEmail = req.body.interviewerEmail;

  const freeSlot = await FreeSlots.findOne({ candidateId });
  const employerEmail = freeSlot.interviewerEmail;
  const bookedSlot = await BookedSlots.findOne({
    candidateId: candidateId,
    interviewerEmail: interviewerEmail,
  });

  // delete existing calendar event
  deleteCalendarEvent(
    candidateId,
    employerEmail,
    bookedSlot.meetId,
    interviewerEmail
  );

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
    await BookedSlots.updateOne({
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
            message: "",
            success: true,
          });
        }
      }
    );
  } catch (error) {
    console.error("Error Storing Booked Slots:", error.message);
  }
});

routes.post("/authenticate-interviewer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const password = req.body.password;

    const bookedSlot = await BookedSlots.findOne({ candidateId: id });

    const match = await bcrypt.compare(
      password,
      bookedSlot.authentication.password
    );
    console.log(match);
    if (match) {
      res.status(201).json({
        success: true,
      });
    } else {
      throw Error("Check Password and Try Again");
    }
  } catch (error) {
    res.status(500).json({
      success: false,
    });
  }
});

module.exports = routes;
