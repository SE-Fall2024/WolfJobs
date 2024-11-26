const express = require('express');

const router = express.Router();

const passport = require('passport');

const usersController = require('../controllers/users_controller');

// import the resume controller
const resumeController = require('../controllers/resume_controller'); 

router.get('/profile',passport.checkAuthentication, usersController.profile);

router.get('/sign-up', usersController.signUp);

router.get('/sign-in', usersController.signIn);

router.post('/create',usersController.create);



//Use passport as a middleware to authenticate
router.post('/create-session', passport.authenticate(
    'local',
    {failureRedirect: '/users/sign-in'},
) ,usersController.createSession)

// Add the resume upload route
router.post('/uploadResume', 
    resumeController.upload.single('resume'), // Multer middleware for file upload
    resumeController.uploadResume // The controller function to handle the resume upload
);

//group49
const Resume = require("../models/resume");
const Job = require("../models/job");
const Application = require('../models/application'); 


router.get('/matched-jobs/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const skills = await Resume.find({ userId }).select('skills');
        const userSkills = skills[0] ? skills[0].skills : [];

        const appliedJobs = await Application.find({ applicantid: userId, applied: true }).select('jobid');
        const appliedJobIds = appliedJobs.map((application) => application.jobid.toString());

        const jobs = await Job.find({ _id: { $nin: appliedJobIds } }); // Exclude applied job IDs

        const matchedJobs = jobs.map((job) => {
            const requiredSkills = job.requiredSkills.split(',').map(skill => skill.trim().toLowerCase());
            const matchedSkills = requiredSkills.filter(skill =>   userSkills.map(userSkill => userSkill.toLowerCase()).includes(skill));
            const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100;

            return {
                jobId: job._id,
                title: job.name,
                location: job.location,
                type: job.type,
                pay: job.pay,
                description: job.description,
                requiredSkills: requiredSkills,
                matchedSkills: matchedSkills,
                matchPercentage: matchPercentage.toFixed(2),
            };
        });

        res.status(200).json({ matchedJobs });
    } catch (error) {
        console.error("Error fetching matched jobs:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


router.get('/applicantresume/:id', resumeController.getResume);


router.get('/sign-out', usersController.destroySession);

router.get('/ping', resumeController.ping);



module.exports = router;
