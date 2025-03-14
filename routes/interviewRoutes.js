const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey:
    process.env.OPEN_API_KEY,
});
const express = require("express");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const routes = express.Router();
const Candidate = require("../models/candidateModal");
const InterviewRoundModel = require("../models/interviewRoundModel");
const User = require("../models/userModel");

const {
  sheduleInterview,
  scheduleCoding,
} = require("../helpers/emailTemplates");
const { transport } = require("../config/mailerTransport");

const generatePasswordForCandidate = async (candidateId, jobId, round) => {
  try {
    const password = otpGenerator.generate(8, {
      digits: true,
      lowerCaseAlphabets: true,
      upperCaseAlphabets: true,
      specialChars: true,
    });
    const candidate = await Candidate.findOne({ _id: candidateId, jobId });
    console.log(candidate);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    candidate.authentication = {
      ...candidate.authentication,
      [round]: hashedPassword,
    };
    await candidate.save();
    return password;
  } catch (error) {
    throw error;
  }
};

// Coding Completion
routes.post("/coding/result/:id", async (req, res) => {
  const _id = req.params.id;
  const answers = req.body.answers;

  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful scoring assistant.
              You are given a set of questions, their respective code, and test cases. 
              This is the answer array: ${JSON.stringify(
            answers
          )}, which contains objects representing each question and its corresponding answer.
    
              Your task is to evaluate all the answers, analyze the candidate's coding skills, and consolidate the evaluation into a single JSON object.
    
              Evaluation Criteria:
              1. Check the correctness of the code by analyzing whether it solves the problem efficiently.
              2. Evaluate logical thinking and the overall code structure, and its level of complexity (lower complexity is better).
              3. Perform a plagiarism check. Deduct points for answers with high similarity to known sources.
              4. Provide constructive feedback for improvement in the "Feedback" section.
    
              Scoring Areas:
              - **Problem Solving:** How well the candidate understands and approaches the problem.
              - **Logical Thinking:** Their ability to design and implement a logical solution.
              - **Code Correctness:** Whether the code functions as expected.
              - **Code Complexity:** How simple and efficient the solution is (less complex solutions score higher).
              - **Plagiarism:** Deduct points based on plagiarism levels.
    
              Result Format: Return a single JSON object formatted like this:
              {
                "score": <total_score_out_of_100>,
                "reason": {
                  "Problem Solving": <score_out_of_100>,
                  "Logical Thinking": <score_out_of_100>,
                  "Code Correctness": <score_out_of_100>,
                  "Code Complexity": <score_out_of_100>,
                  "Code Feedback": "<string_feedback>",
                  "Plagiarism": <score_out_of_100>
                }
              }
    
              Ensure your result strictly follows this format and includes a consolidated analysis of all the answers.`,
        },
      ],
      model: "gpt-4o",
    });


    console.log(chatCompletion.choices[0].message.content)

    const cleanedJsonString = chatCompletion.choices[0].message.content
      .replace(/```json\n/, "")
      .replace(/\n```/, "");
    const re = JSON.parse(cleanedJsonString);

    const candidate = await Candidate.findOne({ _id });
    const jobId = candidate.jobId;
    const interviewRound = await InterviewRoundModel.findOne({ jobId });
    const user = await User.findOne({ _id: candidate.userId });
    candidate.reason = {
      ...candidate.reason,
      coding: re,
    };
    candidate.stage = "coding";
    const score = re.score;
    if (score > 75) {
      candidate.status = "shortlisted";

      if (interviewRound.selectedInterviewRound === "coding-then-technical") {
        candidate.stageStatus = {
          ...candidate.stageStatus,

          interview: "ongoing",
        };

        candidate.stage = "interview";
        candidate.status = "scheduled";

        // send mail for tech interview
        candidate.interviewScheduledDate = Date.now();

        const now = Date.now();
        const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
        candidate.interviewEndDate = new Date(now + fiveDaysInMilliseconds);
        console.log(_id, jobId);
        const password = await generatePasswordForCandidate(
          _id,
          jobId,
          "technical"
        );

        transport.sendMail(
          sheduleInterview(
            candidate.resume.email_address,
            candidate.resume.full_name,
            jobId,
            _id,
            password,
            user.username,
            user.companyName
          ),
          (error, info) => {
            if (error) {
              throw new Error(error);
            }
          }
        );
      }
    } else {
      candidate.status = "rejected";
      if (interviewRound.selectedInterviewRound === "coding-then-technical") {
        candidate.stageStatus = {
          ...candidate.stageStatus,

          interview: "-",
        };
      }
    }
    candidate.stageStatus = {
      ...candidate.stageStatus,
      coding: "completed",
    };
    await candidate.save();

    res.json({
      message: "Email sent successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// Interview
routes.post("/vapi/api/result/:id", async (req, res) => {
  try {
    const result = req.body;
    const _id = req.params.id;
    const transcript = result.data.transcript;
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are helpful scoring Assistant.
          You are given with the transcript data of the interview that was conducted by bot for an user.
          This is the transcript ${transcript}.
          You have to evaluate the interview and analyze the performance of the candidate.
   
          Evaluate the candidate's performance based on their technical skills based on job description, problem-solving ability, soft skills and fit for the job description. Also Evaluate how well the candidate respond relevant to the technical requirement.
          Extract the candidate's technical skills, problem-solving ability, soft skills like communication and enthusiasm with overall interview feedback.
   
          Check how well the candidate fit for the job and give the score
          Score the candidate out of 100 and provide a detailed reason for the score. The reason should be formatted as a JSON object with the following key-value pairs:
   
          score: The total score out of 100.
          reason: A JSON object with the following fields, each representing the score out of 100 and assessment for the corresponding area:
          Problem Solving : score out of 100,
          Emotion  : score out of 100,
          Soft Skills  : score out of 100,
          Technical Skills  : score out of 100,
          Interview Feedback  : string,
       
         `,
        },
        { role: "system", content: transcript },
      ],
      model: "gpt-4o",
    });
    const cleanedJsonString = chatCompletion.choices[0].message.content
      .replace(/```json\n/, "")
      .replace(/\n```/, "");
    const re = JSON.parse(cleanedJsonString);

    const candidate = await Candidate.findOne({ _id });
    const jobId = candidate.jobId;
    const interviewRound = await InterviewRoundModel.findOne({ jobId });
    const user = await User.findOne({ _id: candidate.userId });
    candidate.reason = {
      ...candidate.reason,
      interview: re,
    };
    candidate.stage = "interview";
    const score = re.score;
    if (score > 75) {
      candidate.status = "shortlisted";
      if (interviewRound.selectedInterviewRound === "both") {
        candidate.stageStatus = {
          ...candidate.stageStatus,

          coding: "ongoing",
        };

        candidate.stage = "coding";
        candidate.status = "scheduled";

        // send email for coding round
        candidate.interviewScheduledDate = Date.now();

        const now = Date.now();
        const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
        candidate.interviewEndDate = new Date(now + fiveDaysInMilliseconds);

        const password = await generatePasswordForCandidate(
          _id,
          jobId,
          "coding"
        );

        transport.sendMail(
          scheduleCoding(
            candidate.resume.email_address,
            candidate.resume.full_name,
            jobId,
            _id,
            password,
            user.username,
            user.companyName
          ),
          (error, info) => {
            if (error) {
              throw new Error(error);
            }
          }
        );
      }
    } else {
      candidate.status = "rejected";
      if (interviewRound.selectedInterviewRound === "both") {
        candidate.stageStatus = {
          ...candidate.stageStatus,

          coding: "-",
        };
      }
    }
    candidate.stageStatus = {
      ...candidate.stageStatus,
      interview: "completed",
    };
    await candidate.save();

    res.status(201).json({
      message: "Email sent successfully",
      success: true,
    });
  } catch (error) {
    res.status(401).json(error);
  }
});

routes.post("/authenticate-candidate/:id/:jobId", async (req, res) => {
  try {
    const id = req.params.id;
    const jobId = req.params.jobId;
    const password = req.body.password;
    const round = req.body.round;

    const candidate = await Candidate.findOne({ _id: id, jobId });

    const match = await bcrypt.compare(
      password,
      candidate.authentication[round]
    );

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
