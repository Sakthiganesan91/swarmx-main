const express = require("express");
const routes = express.Router();
const codingQuestionModel = require("../models/CodingQuestionsModel")
const InterviewRound = require("../models/interviewRoundModel");

const OpenAI = require("openai");
const CodingQuestionsModel = require("../models/CodingQuestionsModel");
const openai = new OpenAI({
  apiKey:
    "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",
});

const getCodingQuestion = async (req, res) => {
  const jobId = req.params.id;
  try {
    const selectedInterviewRound = await InterviewRound.findOne({ jobId });
    console.log("Getting coding question...");
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a coding Interviewer.
                You are given with the No.of. questions to be asked and difficulty of a coding interview.
                This is the question count ${selectedInterviewRound.codingRoundQuestions} and difficulty level ${selectedInterviewRound.codingRoundDifficulty}.
                You have to generate the given no.of question based on the difficulty level to evaluate the coding skill of the candidate.
                Cover only the competitive question.
 
               Generate the question in this format:
               {
                    question_title: Title of the coding question,
                    question_description: Description of the coding question,
                    testcases:[
                    {
                    sample_input: Sample input for the coding question,
                    sample_output: Sample output for the coding question,}
                    ](Array with 3 testcases)
               }
                Return the questions as Array(even if it one question)
                Give only the formatted json as response
               `,
        },
      ],
      model: "gpt-4o",
    });

    const cleanedJsonString = chatCompletion.choices[0].message.content
      .replace(/```json\n/, "")
      .replace(/\n```/, "");
    const re = JSON.parse(cleanedJsonString);
    console.log(re);
    res.json({
      selectedInterviewRound: selectedInterviewRound,
      question: re,
      success: true,
    });
  } catch (error) {
    res.status(401).json({
      error: error.message,
    });
  }
};


const generateCodingQuestions = async (req, res) => {
  const codingRoundQuestions = req.body.count;
  const codingRoundDifficulty = req.body.difficulty;
  try {

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a coding Interviewer.
                You are given with the No.of. questions to be asked and difficulty of a coding interview.
                This is the question count ${codingRoundQuestions} and difficulty level ${codingRoundDifficulty}.
                You have to generate the given no.of question based on the difficulty level to evaluate the coding skill of the candidate.
                Cover only the competitive question.
 
               Generate the question in this format:
               {
                    question_title: Title of the coding question,
                    question_description: Description of the coding question,
                    difficulty: Difficulty level of the question
                    testcases:[
                    {
                    sample_input: Sample input for the coding question,
                    sample_output: Sample output for the coding question,}
                    ](Array with 20 testcases)
               }
                Return the questions as Array(even if it one question)
                Give only the formatted json as response
               `,
        },
      ],
      model: "gpt-4o",
    });

    const cleanedJsonString = chatCompletion.choices[0].message.content
      .replace(/```json\n/, "")
      .replace(/\n```/, "");
    const re = JSON.parse(cleanedJsonString);

    // storing
    re.map(async (question) => {
      const codingQuestion = await codingQuestionModel.findOne({ title: question.question_title })
      if (codingQuestion) {
        return;
      }

      try {
        const results = await CodingQuestionsModel.create({
          title: question.question_title,
          description: question.question_description,
          difficulty: question.difficulty.toLowerCase(),
          testcase: question.testcases
        })
      }
      catch (error) {
        console.log(error)
      }
    })

    res.json({
      questions: re,
      success: true,
    });
  } catch (error) {
    res.status(401).json({
      error: error.message,
    });
  }
};

routes.get("/get-coding-question/:id", getCodingQuestion);
routes.get("/generate-coding-questions", generateCodingQuestions);

module.exports = routes;
