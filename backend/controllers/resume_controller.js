// controllers/resume_controller.js
const Resume = require('../models/resume');
const User = require('../models/user');
const multer = require('multer');

//group49
const Job = require('../models/job');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
// Predefined skills to check against
const predefinedSkills = [
  "JavaScript",
  "Python",
  "Java",
  "React",
  "Node.js",
  "CSS",
  "HTML",
  "SQL",
  "AWS",
  "Docker"
];

//google generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const GenAI = new GoogleGenerativeAI("API KEY");
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

Attached Resume: Use the information in this resume to reflect my qualifications, including past roles, skills, and any unique projects or accomplishments that are particularly relevant.

Job Description:

Position: [Job Title]
Company: [Company Name]
Description: [Job Responsibilities and Requirements]
Tone and Style:

The tone should be professional yet engaging, showing enthusiasm for the position and the company.
I would like the cover letter to feel personalized to this specific role and company.
Emphasize any unique attributes or skills that set me apart from other candidates, especially if they align well with the job description.
Structure:

Introduction: A brief overview of who I am, why I’m excited about this position, and how I found the job.
Body: A couple of paragraphs that:
Highlight my relevant skills, work experiences, and accomplishments that align with the job description.
Use examples or brief anecdotes to demonstrate how my previous work aligns with the company’s needs.
Conclusion: A closing paragraph that reaffirms my interest in the role, expresses eagerness to contribute to the company, and thanks the hiring team for their time.
Please ensure that the cover letter is tailored, avoids generic phrases, and feels like a strong, compelling argument for why I am the ideal candidate for this position. Output the cover letter in a format ready for submission.
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
      return cb(new Error('Please upload a PDF file'));
    }
    cb(undefined, true);
  }
});

// Function to extract skills from the resume PDF
const extractSkillsFromResume = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer); // Extract text from PDF
    const resumeText = data.text.toLowerCase();

    // Match against predefined skills
    const matchedSkills = predefinedSkills.filter((skill) =>
      resumeText.includes(skill.toLowerCase())
    );

    return matchedSkills; // Return the list of matched skills
  } catch (error) {
    console.error("Error extracting skills:", error);
    return []; // Return empty array if error occurs
  }
};


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
  const { id: applicantId } = req.body; // Get applicantId from request body
  const file = req.file; // Get the uploaded file

  // Validate applicantId
  if (!applicantId || !mongoose.Types.ObjectId.isValid(applicantId)) {
    return res.status(400).send({ error: "Invalid applicant ID" });
  }

  if (!file) {
    return res.status(400).send({ error: "No file uploaded" });
  }

  try {
    // Extract skills from the uploaded resume
    const skills = await extractSkillsFromResume(file.buffer);

    // Check if a resume already exists for the applicant
    const existingResume = await Resume.findOne({ applicantId });
    if (existingResume) {
      // Remove the existing resume if found
      await existingResume.remove();
    }

    // Create a new resume and save it to the database
    const newResume = new Resume({
      applicantId,
      fileName: file.originalname,
      fileData: file.buffer,
      contentType: file.mimetype,
      skills, // Store the extracted skills
    });

    await newResume.save();


    const user = await User.findOne({ _id: applicantId });
    if (user) {
      user.resumeId = newResume._id;
      user.resume = newResume.fileName;
      await user.save();
    }

    res.status(201).send({
      message: "Resume uploaded and skills extracted successfully",
      resume: newResume,
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).send({ error: "Internal server error" });
  }
};

exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ applicantId: req.params.id });
    if (!resume) {
      return res.status(404).send({ error: 'Resume not found' });
    }
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename=${resume.fileName}`);
    res.send(resume.fileData);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
};

exports.upload = upload;


const normalizeSkills = (skills) => skills.map(skill => skill.trim().toLowerCase());

exports.calculateMatchingPercentage = async (req, res) => {
  try {
    const { userId, jobId } = req.params;

    // Validate inputs
    if (!userId || !jobId) {
      return res.status(400).json({ message: 'Both userId and jobId are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid userId or jobId.' });
    }

    // Fetch resume and job data
    const userResume = await Resume.findOne({ applicantId: userId });
    if (!userResume) {
      return res.status(404).json({ message: 'Resume not found for the user.' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

 
    const resumeSkills = normalizeSkills(userResume.skills || []);
    const requiredSkills = normalizeSkills(job.requiredSkills?.split(',') || []);

    if (requiredSkills.length === 0) {
      return res.status(400).json({ message: 'Job has no required skills defined.' });
    }

    if (resumeSkills.length === 0) {
      return res.status(400).json({ message: 'Resume has no skills defined.' });
    }

    // Calculate matching percentage
    const matchingSkills = resumeSkills.filter(skill => requiredSkills.includes(skill));
    const matchingPercentage = (matchingSkills.length / requiredSkills.length) * 100;

    return res.status(200).json({
      message: 'Matching percentage calculated successfully.',
      matchingSkills,
      matchingPercentage: `${matchingPercentage.toFixed(2)}%`
    });
  } catch (error) {
    console.error(`Error calculating matching percentage for userId: ${req.params.userId}, jobId: ${req.params.jobId}`, error);
    return res.status(500).json({ message: 'Server error occurred.' });
  }
};

module.exports.getResumeSkills = async function (req, res) {
  try {
    const { applicantId } = req.params; // Extract applicantId from route params

    // Find the resume for the given applicantId
    const resume = await Resume.findOne({ applicantId: applicantId });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found for this applicant.",
        success: false,
      });
    }

    
    return res.status(200).json({
      message: "Skills retrieved successfully.",
      success: true,
      skills: resume.skills, 
    });
  } catch (error) {
    console.error("Error fetching resume skills:", error);
    return res.status(500).json({
      message: "Internal server error.",
      success: false,
    });
  }
};

exports.ping = (req, res) => {
  res.send({ message: 'Pong' });
};
