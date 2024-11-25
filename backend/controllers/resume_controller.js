// controllers/resume_controller.js
const Resume = require("../models/resume");
const User = require("../models/user");
//multer
const multer = require("multer");
const pdfParse = require("pdf-parse");

const { GoogleGenerativeAI } = require("@google/generative-ai");

require("dotenv").config();

const GenAI = new GoogleGenerativeAI("API Key");

const model = GenAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.78,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  },
});

const INPUT_PROMPT_USER = `I am seeking a well-crafted, professional cover letter based on the information in my resume and a job description I will provide. I want the cover letter to clearly highlight my relevant skills, experiences, and accomplishments that match the job requirements. Here are the specifics:
write my information in cover letter
my name is rahil. 
my email id is rahilshukla3122@gmail.com.
my phone number is +1 9123456789
1. Attached Resume: Use the information in this resume to reflect my qualifications, including past roles, skills, and any unique projects or accomplishments that are particularly relevant.
2. Job Description:
    - Position: Python Developer
    - Company: Amazon
    - Description: As a Python Developer at Amazon, you’ll be responsible for designing, developing, and optimizing scalable, high-performance applications and systems. You’ll work closely with cross-functional teams to implement data-driven solutions, automate processes, and improve infrastructure efficiency. Strong problem-solving skills and experience with Python frameworks and AWS services are essential for this role, along with a focus on delivering high-quality, maintainable code.
3. Tone and Style:
    - The tone should be professional yet engaging, showing enthusiasm for the position and the company.
    - I would like the cover letter to feel personalized to this specific role and company.
    - Emphasize any unique attributes or skills that set me apart from other candidates, especially if they align well with the job description.
4. Structure:
    - Introduction: A brief overview of who I am, why I’m excited about this position, and how I found the job.
    - Body: A couple of paragraphs that:
      - Highlight my relevant skills, work experiences, and accomplishments that align with the job description.
      - Use examples or brief anecdotes to demonstrate how my previous work aligns with the company’s needs.
    - Conclusion: A closing paragraph that reaffirms my interest in the role, expresses eagerness to contribute to the company, and thanks the hiring team for their time.
Please ensure that the cover letter is tailored, avoids generic phrases, and feels like a strong, compelling argument for why I am the ideal candidate for this position. Output the cover letter in a format ready for submission.
i only need just the cover letter output in string format.
`;

INPUT_PROMPT_MANAGER = `
  You are an ATS (Applicant Tracking System) scanner specializing in university dining and campus enterprise operations. Evaluate the provided resume against the job description using these guidelines:
    1. Key Focus Areas:
    - Academic achievements
    - Leadership experience (college or high school clubs)
    - Specific technical skills mentioned in the job description
    2. Important Considerations:
    - Prior dining/campus operations experience is not expected from students
    - Good academic standing is crucial
    - Leadership experience is highly valued
    3. Specific Requirements:
    - Check for any "Preferred Experience" mentioned in the job description
    - If the candidate lacks these skills, reduce their match score accordingly
    4. Evaluation Process:
     Calculate the overall match percentage of the applicant by comparing their resume and the job description.
    Job Description:
    Essential functions and responsibilities include but are not limited to:
    - Design, develop, test, and deploy scalable, high-performance Python applications, libraries, and frameworks.
    - Collaborate with cross-functional teams to build solutions that leverage AWS services and tools, ensuring efficiency and security.
    - Conduct code reviews, debug and resolve issues, and implement best practices in software development and continuous integration.
    - Write clean, maintainable, and well-documented code following Amazon’s coding standards and guidelines.
    - Automate processes and optimize performance for data pipelines, web applications, and backend services.
    - Monitor application performance, troubleshoot technical issues, and work on production support as needed.
    - Contribute to team knowledge by documenting processes, sharing best practices, and participating in technical discussions.
    Essential Qualifications:
    - Bachelor's degree in Computer Science, Engineering, or related technical field, or equivalent practical experience.
    - Proficiency in Python and experience with related frameworks (e.g., Django, Flask) and libraries.
    - Familiarity with cloud technologies, preferably AWS, and distributed systems.
    - Strong problem-solving skills, ability to work effectively in a fast-paced environment, and willingness to adapt to new technologies.
    - Ability to follow and improve upon established processes and work collaboratively in a team setting.
    - Excellent communication skills to effectively collaborate with technical and non-technical stakeholders.
    - Must be comfortable with Agile methodologies and continuous integration/deployment practices.
    Output Format:
    Provide the final match percentage score in pure JSON format as follows, I only want this JSON response as an output:
    {
      "match_percentage": [Insert match percentage here]
    }
    Note: Be objective and thorough in your assessment, considering both explicit and implicit requirements of the position.
`;

const upload = multer({
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error("Please upload a PDF file"));
    }
    cb(undefined, true);
  },
});

module.exports.parseResume = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const resumeId = user.resumeId;

    // Fetch the resume from the database using the provided resume ID
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).send({ error: "Resume not found" });
    }

    // Parse the PDF buffer data to extract text
    try {
      const data = await pdfParse(resume.fileData);
      const text = data.text;

      const prompt = `${INPUT_PROMPT_USER}\nResume: ${text}`;

      const generationResult = await model.generateContent(prompt);
      const response = await generationResult.response;
      const responseText = response.text();
      console.log("type", typeof responseText);

      console.log("Raw response:", responseText);
      // console.log(JSON.parse(responseText) || "Not solved")

      let cover_letter;
      try {
        cover_letter = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        return res.status(500).send({
          error: "Failed to parse AI response",
          details: responseText,
        });
      }

      res
        .status(200)
        .send({ success: true, cover_letter: cover_letter.cover_letter });
    } catch (error) {
      console.error("Error processing resume:", error);
      res.status(500).send({
        error: "An error occurred while processing the resume",
        details: error.message,
      });
    }
  } catch (error) {
    console.error("Error parsing resume:", error);
    res
      .status(500)
      .send({ error: "Failed to parse resume", details: error.message });
  }
};

// Resume upload handler
exports.uploadResume = async (req, res) => {
  // first look for a resume with the same applicantId
  const existingResume = await Resume.findOne({
    applicantId: req.body.id,
  });

  if (existingResume) {
    // delete the existing resume
    existingResume.remove();
  }

  // find the user and add the resume
  let user = await User.findOne({ _id: req.body.id });

  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }

  try {
    const resume = new Resume({
      applicantId: user._id, // Assuming the user is authenticated
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      contentType: "application/pdf",
    });
    await resume.save();

    // update the user's resumeId
    user.resumeId = resume._id;
    user.resume = resume.fileName;
    await user.save();

    res.status(201).send({ message: "Resume uploaded successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Matching percentage for manager
module.exports.managerParseResume = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(201).json({
        success: false,
        message: "User does not exist.",
      });
    }

    const resumeId = user.resumeId;

    // Fetch the resume from the database using the provided resume ID
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).send({ error: "Resume not found" });
    }

    // Parse the PDF buffer data to extract text
    try {
      const data = await pdfParse(resume.fileData);
      const text = data.text;

      const prompt = `${INPUT_PROMPT_MANAGER}\nResume: ${text}`;

      const generationResult = await model.generateContent(prompt);
      const response = await generationResult.response;
      const responseText = response.text();
      console.log("type", typeof responseText);

      console.log("Raw response:", responseText);
      console.log(JSON.parse(responseText) || "Not solved");

      let match_percentage;
      try {
        match_percentage = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        return res.status(500).send({
          error: "Failed to parse AI response",
          details: responseText,
        });
      }

      if (
        !match_percentage ||
        typeof match_percentage.match_percentage !== "number"
      ) {
        console.error("Invalid Match Percentage format:", match_percentage);
        return res.status(500).send({
          error: "Invalid Match Percentage format",
          details: match_percentage,
        });
      }

      // Update the resume document with the ATS score
      resume.match_percentage = match_percentage.match_percentage;
      await resume.save();

      console.log("Match Percentage:", match_percentage.match_percentage);
      res.status(200).send({
        success: true,
        match_percentage: match_percentage.match_percentage,
      });
    } catch (error) {
      console.error("Error processing resume:", error);
      res.status(500).send({
        error: "An error occurred while processing the resume",
        details: error.message,
      });
    }
  } catch (error) {
    console.error("Error parsing resume:", error);
    res
      .status(500)
      .send({ error: "Failed to parse resume", details: error.message });
  }
};

// Resume upload handler
exports.uploadResume = async (req, res) => {
  // first look for a resume with the same applicantId
  const existingResume = await Resume.findOne({
    applicantId: req.body.id,
  });

  if (existingResume) {
    // delete the existing resume
    existingResume.remove();
  }

  // find the user and add the resume
  let user = await User.findOne({ _id: req.body.id });

  if (!user) {
    return res.status(404).send({ error: "User not found" });
  }

  try {
    const resume = new Resume({
      applicantId: user._id, // Assuming the user is authenticated
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      contentType: "application/pdf",
    });
    await resume.save();

    // update the user's resumeId
    user.resumeId = resume._id;
    user.resume = resume.fileName;
    await user.save();

    res.status(201).send({ message: "Resume uploaded successfully" });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ applicantId: req.params.id });
    if (!resume) {
      return res.status(404).send({ error: "Resume not found" });
    }
    res.set("Content-Type", "application/pdf");
    // send file name
    res.set("Content-Disposition", `inline; filename=${resume.fileName}`);
    res.send(resume.fileData);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

// Make sure to export the multer upload as well
exports.upload = upload;

exports.ping = (req, res) => {
  res.send({ message: "Pong" });
};
