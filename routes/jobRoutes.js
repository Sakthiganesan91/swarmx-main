const express = require("express");
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey:
    "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",
});
const jobController = require("../controller/jobController");
const requireAuth = require("../middleware/authMiddleware");
const routes = express.Router();

routes.use(requireAuth);

routes.get("/get-job", jobController.getJob);
routes.post("/post_job", jobController.addJob);
routes.get("/get-job/:id", jobController.getJobById);
routes.put("/edit-job/:id", jobController.updateJob);
routes.delete("/delete-job/:id", jobController.deleteJob);
routes.put("/expire-job/:id", jobController.expireJob);

const generateJobDescription = async (req, res) => {
  const {
    title,
    designation,
    experience,
    education,
    roles,
    keywords,
    location,
    benefits,
  } = req.body;
  try {
    sm_prompt = `Assistant is an HR Manager, generated accurate 'Job Description' based on the given information.\n`;
    user_text = `
        Generate job description based on the given input.
        Note: Do not repeat the same sentences.
        Make format use "<br>" tag,using instead of "\n" use "<br>" and using  instead of "\n\n" use "<br><br>",
        Generate relevant titles and contents based on the keywords json provided.
    
        Answer the response with below template with neat formatting, including new titles from keywords when required :
        Job Title:${title}
        Designation: ${designation}
        Experience : ${experience}
        Education : ${education}
        Roles: ${roles}
        Job Purpose: [List of pointers job purpose here]
        Key Responsibilities Area: [List of key responsibilities here based on role] in few bullet points
        Required Competencies: [List of required competencies here based on ${keywords} and considering experience and education] in few bullet points
        Good to Know: [Additional information that is good to know] in few bullet points
        Location: ${location}
        Benefits: ${benefits}
        `;

    response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: sm_prompt },

        { role: "user", content: user_text },
      ],
    });

    res
      .status(201)
      .json({ jobDescription: response.choices[0].message.content });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

routes.post("/generate-job-description", generateJobDescription);

routes.get("/get-keyword-by-jobid/:id", jobController.getKeywordByJobId);

module.exports = routes;
