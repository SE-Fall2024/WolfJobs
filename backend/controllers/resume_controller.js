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
