const User = require("../../../models/user");
const jwt = require("jsonwebtoken");
const Food = require("../../../models/food");
const History = require("../../../models/history");
const Job = require("../../../models/job");
const Application = require("../../../models/application");
const AuthOtp = require("../../../models/authOtp");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const SavedJob = require("../../../models/save");

require("dotenv").config();

function getTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function verifyOtp(req, res) {
  const { userId, otp } = req.body;

  const record = await AuthOtp.findOne({ userId, otp });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  await AuthOtp.deleteOne({ _id: record._id });

  res.json({ success: "OTP verified, login successful" });
}

module.exports.createSession = async function (req, res) {
  try {
    let user = await User.findOne({ email: req.body.email });

    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");

    // Check if user exists
    if (!user) {
      return res.status(422).json({
        message: "Invalid username or password",
      });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(422).json({
        message: "Invalid username or password",
      });
    }

    // If everything is fine, generate a token
    return res.status(200).json({
      message: "Sign In Successful, here is your token, please keep it safe",
      data: {
        token: jwt.sign(user.toJSON(), "wolfjobs", { expiresIn: "100000" }),
        user: user,
      },
      success: true,
    });
  } catch (err) {
    console.log("*******", err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports.createHistory = async function (req, res) {
  try {
    let history = await History.create({
      date: req.body.date,
      caloriesgain: req.body.total,
      caloriesburn: req.body.burnout,
      user: req.body.id,
    });

    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "History Created Successfully",

      data: {
        history: history,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};

module.exports.signUp = async function (req, res) {
  try {
    // Check if passwords match
    if (req.body.password !== req.body.confirm_password) {
      return res.status(422).json({
        message: "Passwords do not match",
      });
    }

    // Check if user already exists
    User.findOne({ email: req.body.email }, async function (err, user) {
      if (err) {
        return res.status(500).json({ message: "Internal Server Error" });
      }

      if (user) {
        res.set("Access-Control-Allow-Origin", "*");
        return res.status(200).json({
          message:
            "Sign Up Successful, here is your token, please keep it safe",
          data: {
            token: jwt.sign(user.toJSON(), "wolfjobs", { expiresIn: "100000" }),
            user,
          },
          success: true,
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // Create a new user with hashed password
      User.create(
        { ...req.body, password: hashedPassword },
        function (err, newUser) {
          if (err) {
            return res.status(500).json({ message: "Internal Server Error" });
          }

          res.set("Access-Control-Allow-Origin", "*");
          return res.status(200).json({
            message:
              "Sign Up Successful, here is your token, please keep it safe",
            data: {
              token: jwt.sign(newUser.toJSON(), "wolfjobs", {
                expiresIn: "100000",
              }),
              user: newUser,
            },
            success: true,
          });
        }
      );
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.getProfile = async function (req, res) {
  try {
    let user = await User.findById(req.params.id);
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "The User info is",

      data: {
        //user.JSON() part gets encrypted

        //token: jwt.sign(user.toJSON(), env.jwt_secret, { expiresIn: "100000" }),
        user: user,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};

module.exports.editProfile = async function (req, res) {
  // if (req.body.password == req.body.confirm_password) {
  try {
    let user = await User.findById(req.body.id);

    user.name = req.body.name;
    user.password = req.body.password;
    user.role = req.body.role;
    user.address = req.body.address;
    user.phonenumber = req.body.phonenumber;
    user.hours = req.body.hours;
    user.availability = req.body.availability;
    user.gender = req.body.gender;
    // user.dob = req.body.dob;
    check = req.body.skills;
    user.skills = check;
    user.save();
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "User is updated Successfully",

      data: {
        //user.JSON() part gets encrypted

        // token: jwt.sign(user.toJSON(), env.jwt_secret, {
        //   expiresIn: "100000",
        // }),
        user,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
  // } else {
  //   return res.json(400, {
  //     message: "Bad Request",
  //   });
  // }
};
module.exports.searchUser = async function (req, res) {
  try {
    var regex = new RegExp(req.params.name, "i");

    let users = await Job.find({ name: regex });
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "The list of Searched Users",

      data: {
        //user.JSON() part gets encrypted

        //token: jwt.sign(user.toJSON(), env.jwt_secret, { expiresIn: "100000" }),
        users: users,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};

module.exports.getHistory = async function (req, res) {
  try {
    let history = await History.findOne({
      user: req.query.id,
      date: req.query.date,
    });
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "The User Profile",

      data: {
        //user.JSON() part gets encrypted

        // token: jwt.sign(user.toJSON(), env.jwt_secret, { expiresIn: "100000" }),
        history: history,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};

module.exports.createJob = async function (req, res) {
  let user = await User.findOne({ _id: req.body.id });
  check = req.body.skills;
  questions = req.body.questions;
  filteredQuestions = questions.filter((item) => item != "");
  try {
    let job = await Job.create({
      name: req.body.name,
      managerid: user._id,
      managerAffilication: user.affiliation,
      type: req.body.type,
      location: req.body.location,
      description: req.body.description,
      pay: req.body.pay,
      requiredSkills: req.body.requiredSkills,
      // question1: req.body.question1,
      // question2: req.body.question2,
      // question3: req.body.question3,
      // question4: req.body.question4,
      questions: filteredQuestions,
    });
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      data: {
        job: job,
        //token: jwt.sign(user.toJSON(), env.jwt_secret, { expiresIn: "100000" })
      },
      message: "Job Created!!",
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "NOT CREATED",
    });
  }
};

module.exports.index = async function (req, res) {
  let jobs = await Job.find({}).sort("-createdAt");

  //Whenever we want to send back JSON data
  res.set("Access-Control-Allow-Origin", "*");
  return res.json(200, {
    message: "List of jobs",

    jobs: jobs,
  });
};

module.exports.fetchApplication = async function (req, res) {
  let application = await Application.find({}).sort("-createdAt");

  //Whenever we want to send back JSON data
  res.set("Access-Control-Allow-Origin", "*");
  return res.json(200, {
    message: "List of Applications",

    application: application,
  });
};

module.exports.createApplication = async function (req, res) {
  // let user = await User.findOne({ _id: req.body.id });
  // check = req.body.skills;

  try {
    const existingApplication = await Application.findOne({
      applicantid: req.body.applicantId,
      jobid: req.body.jobId,
    });

    if (existingApplication) {
      res.set("Access-Control-Allow-Origin", "*");
      return res.json(400, {
        message: "You have already applied for the job",
        error: true,
      });
    }

    let application = await Application.create({
      // applicantemail: req.body.applicantemail,
      applicantid: req.body.applicantid,
      applicantname: req.body.applicantname,
      applicantemail: req.body.applicantemail,
      applicantskills: req.body.applicantSkills,
      skills: req.body.skills,
      address: req.body.address,
      phonenumber: req.body.phonenumber,
      hours: req.body.hours,
      dob: req.body.dob,
      gender: req.body.gender,
      jobname: req.body.jobname,
      jobid: req.body.jobid,
      managerid: req.body.managerid,
    });
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      data: {
        application: application,
        //token: jwt.sign(user.toJSON(), env.jwt_secret, { expiresIn: "100000" })
      },
      message: "Job Created!!",
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "NOT CREATED",
    });
  }
};

//group49
// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // App-specific password or actual password if Less Secure Apps is enabled
  },
});

module.exports.modifyApplication = async function (req, res) {
  try {
    // Log the incoming request body to confirm status and applicationId are provided
    console.log("Request Body:", req.body);

    // Find the application by ID and log if it's found
    let application = await Application.findById(req.body.applicationId);
    if (!application) {
      console.error("Application not found for ID:", req.body.applicationId);
      return res.status(404).json({ message: "Application not found" });
    }
    console.log("Application found:", application);

    // Update the application status
    application.status = req.body.status;

    // Log applicant email to confirm it’s not undefined
    console.log("Applicant Email:", application.applicantemail);

    // Send acceptance email if status is set to "accepted"
    if (req.body.status === "accepted") {
      if (!application.applicantemail) {
        throw new Error("Applicant email is undefined or empty");
      }
      const acceptMailOptions = {
        from: "autowolfjobs@gmail.com",
        to: application.applicantemail,
        subject: "Application Accepted",
        text: `Dear ${application.applicantname},\n\nCongratulations! We are pleased to inform you that your application for ${application.jobname} has been accepted. Our team will reach out with further details soon.\n\nBest regards,\nWolfJobs Team`,
      };

      console.log("Sending acceptance email with options:", acceptMailOptions);

      transporter.sendMail(acceptMailOptions, (error, info) => {
        if (error) {
          console.error("Error sending acceptance email:", error);
        } else {
          console.log("Acceptance email sent:", info.response);
        }
      });
    }
    if (req.body.status === "grading") {
      // application.answer1 = req.body.answer1;
      // application.answer2 = req.body.answer2;
      // application.answer3 = req.body.answer3;
      // application.answer4 = req.body.answer4;
      application.answers = req.body.answers;
    }
    if (req.body.status === "rating") {
      application.rating = req.body.rating;
    }

    // Send screening email if status is set to "screening"
    if (req.body.status === "screening") {
      if (!application.applicantemail) {
        throw new Error("Applicant email is undefined or empty");
      }
      const screeningMailOptions = {
        from: "autowolfjobs@gmail.com",
        to: application.applicantemail,
        subject: "Application Screening Phase",
        text: `Dear ${application.applicantname},\n\nYour application for ${application.jobname} has moved to the screening phase. Please fill out the questionnaire.\n\nBest regards,\nWolfJobs Team`,
      };

      console.log(
        "Sending screening email with options:",
        screeningMailOptions
      );

      transporter.sendMail(screeningMailOptions, (error, info) => {
        if (error) {
          console.error("Error sending screening email:", error);
        } else {
          console.log("Screening email sent:", info.response);
        }
      });
    }

    // Send rejection email if status is set to "rejected"
    if (req.body.status === "rejected") {
      if (!application.applicantemail) {
        throw new Error("Applicant email is undefined or empty");
      }
      const rejectMailOptions = {
        from: "autowolfjobs@gmail.com",
        to: application.applicantemail,
        subject: "Application Rejected",
        text: `Dear ${application.applicantname},\n\nThank you for your interest in ${application.jobname}. Unfortunately, we have decided to move forward with other candidates.\n\nBest regards,\nWolfJobs Team`,
      };

      console.log("Sending rejection email with options:", rejectMailOptions);

      transporter.sendMail(rejectMailOptions, (error, info) => {
        if (error) {
          console.error("Error sending rejection email:", error);
        } else {
          console.log("Rejection email sent:", info.response);
        }
      });
    }

    // Save the updated application to the database
    await application.save();
    console.log("Application updated successfully in database:", application);

    res.set("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      message: "Application updated successfully",
      data: { application },
      success: true,
    });
  } catch (err) {
    console.error("Error in modifyApplication:", err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports.acceptApplication = async function (req, res) {
  try {
    let application = await Application.findById(req.body.applicationId);

    application.status = "1";

    application.save();
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "Application is updated Successfully",

      data: {
        //user.JSON() part gets encrypted

        // token: jwt.sign(user.toJSON(), env.jwt_secret, {
        //   expiresIn: "100000",
        // }),
        application,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};

module.exports.rejectApplication = async function (req, res) {
  try {
    let application = await Application.findById(req.body.applicationId);

    application.status = "2";

    application.save();
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "Application is updated Successfully",

      data: {
        //user.JSON() part gets encrypted

        // token: jwt.sign(user.toJSON(), env.jwt_secret, {
        //   expiresIn: "100000",
        // }),
        application,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};

module.exports.closeJob = async function (req, res) {
  try {
    let job = await Job.findById(req.body.jobid);

    job.status = "closed";

    job.save();
    res.set("Access-Control-Allow-Origin", "*");
    return res.json(200, {
      message: "Job is updated Successfully",

      data: {
        //user.JSON() part gets encrypted

        // token: jwt.sign(user.toJSON(), env.jwt_secret, {
        //   expiresIn: "100000",
        // }),
        job,
      },
      success: true,
    });
  } catch (err) {
    console.log(err);

    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};

const logger = require("./simpleLogger");

module.exports.generateOtp = async function (req, res) {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expirationTime = 10 * 60 * 1000;
  try {
    // logger.info("generateOtp function called");
    // logger.info("Creating OTP document in database...");

    let authOtp = await AuthOtp.create({
      userId: req.body.userId,
      otp: otp,
      expiresAt: new Date(Date.now() + expirationTime),
    });
    // logger.info(`OTP document created for user ${req.body.userId}`);

    const user = await User.findById(req.body.userId);
    if (!user) {
      // logger.error(`User not found with ID: ${req.body.userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { email } = user;
    logger.info(`Sending OTP email to: ${email}`);

    const mailOptions = {
      from: "autowolfjobs@gmail.com",
      to: email,
      subject: "Your OTP for Login Verification",
      html: `<p>Your OTP is <b>${otp}</b>. This OTP is valid for 10 minutes.</p>`,
    };

    await getTransport().sendMail(mailOptions);
    logger.info(`OTP email sent successfully to: ${email}`);

    res.set("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      success: true,
      message: "OTP is generated Successfully",
    });
  } catch (err) {
    logger.error(`Error in generateOtp function: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

module.exports.verifyOtp = async function (req, res) {
  const { userId, otp } = req.body;

  const record = await AuthOtp.findOne({ userId, otp });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  await AuthOtp.deleteOne({ _id: record._id });

  res.json({ success: "OTP verified, login successful" });
};

// module.exports.verifyOtp = async function (req, res) {
//   try {
//     const authOtp = await AuthOtp.findOne({
//       userId: req.body.userId,
//       otp: req.body.otp,
//     });

//     if (!authOtp) {
//       return res.json(422, {
//         error: true,
//         message: "OTP is not correct",
//       });
//     }

//     authOtp.remove();

//     await User.updateOne(
//       { _id: req.body.userId },
//       { $set: { isVerified: true } }
//     );

//     res.set("Access-Control-Allow-Origin", "*");
//     return res.json(200, {
//       success: true,
//       message: "OTP is verified Successfully",
//     });
//   } catch (err) {
//     console.log(err);

//     return res.json(500, {
//       message: "Internal Server Error",
//     });
//   }
// };

// controllers/api/v1/users_api.js
module.exports.notifyApplicant = async function (req, res) {
  try {
    const { applicantId, jobId, interviewDate } = req.body;

    // Update the application with the interview date
    const application = await Application.findById(applicantId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.interviewDate = new Date(interviewDate);
    application.status = "interview_scheduled";
    await application.save();

    // Retrieve applicant's details
    const user = await User.findById(application.applicantid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format the interview date for notification
    const formattedDate = new Date(interviewDate).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short",
    });

    // Send an email with interview details
    const mailOptions = {
      from: "your_email@gmail.com",
      to: user.email,
      subject: "Interview Scheduled for Your Application",
      html: `<p>Dear ${user.name},</p>
             <p>Your interview for the job <strong>${application.jobname}</strong> is scheduled.</p>
             <p><strong>Date and Time:</strong> ${formattedDate}</p>
             <p>Best regards,<br/>WolfJobs Team</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Interview scheduled and notification sent successfully",
    });
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Accept Interview - Set status to "interview_accepted"
exports.acceptInterview = async (req, res) => {
  const { applicationId } = req.body;

  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Set status to "interview_accepted" for manager review post-interview
    application.status = "interview_accepted";
    await application.save();

    res.status(200).json({ message: "Interview accepted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error accepting interview", error });
  }
};

// Decline Interview - Set status to "rejected"
exports.declineInterview = async (req, res) => {
  const { applicationId } = req.body;

  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Set status to "rejected" for manager to view in rejected tab
    application.status = "rejected";
    await application.save();

    res.status(200).json({
      message: "Interview declined, application moved to rejected status",
    });
  } catch (error) {
    res.status(500).json({ message: "Error declining interview", error });
  }
};

//save jobs
module.exports.saveJob = async function (req, res) {
  try {
    const { userId, jobId } = req.body;
    if (!userId || !jobId) {
      return res.status(400).json({
        message: "User ID and Job ID are required",
        success: false,
      });
    }
    console.log("User ID:", userId);
    console.log("Job ID:", jobId);
    let save_Job = await SavedJob.findOne({ userId: userId, jobId: jobId });
    if (save_Job) {
      await SavedJob.deleteOne({ _id: save_Job._id });
      // Update the job's saved status to false
      await Job.updateOne({ _id: jobId }, { saved: false });

      res.set("Access-Control-Allow-Origin", "*");
      return res.status(200).json({
        message: "Job unsaved",
        success: true,
      });
    } else {
      let newSaveJob = await SavedJob.create({ userId: userId, jobId: jobId });
      await Job.updateOne({ _id: jobId }, { saved: true });
      res.set("Access-Control-Allow-Origin", "*");
      return res.json(200, {
        message: "Job saved",
        data: { savedJob: newSaveJob },
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
    return res.json(500, {
      message: "Internal Server Error",
    });
  }
};
//display save
module.exports.saveJobList = async function (req, res) {
  try {
    const { userId } = req.params.id;

    const savedJobs = await SavedJob.find(userId);
    res.set("Access-Control-Allow-Origin", "*");
    if (savedJobs.length === 0) {
      return res.status(200).json({
        message: "No saved jobs found",
        data: [],
        success: true,
      });
    }
    const jobIds = savedJobs.map((job) => job.jobId);
    const jobs = await Job.find({ _id: { $in: jobIds } });
    res.set("Access-Control-Allow-Origin", "*");
    return res.status(200).json({
      message: "Saved jobs retrieved successfully",
      data: jobs,
      success: true,
    });
  } catch (error) {
    console.error("Error counting saved jobs:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

//group49
module.exports.applyJob = async (req, res) => {
  try {
    console.log(req.body); 

    // Check if all required fields are provided
    const { jobname, applicantname, applicantid, applicantemail, applicantSkills, phonenumber, managerid, jobid } = req.body;

    if (!jobname || !applicantname || !applicantid || !jobid) {
      return res.status(400).json({ message: "Missing required fields", error: true });
    }

    // Check if the user has already applied for the job
    const existingApplication = await Application.findOne({
      applicantid,
      jobid,
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You have already applied for this job", error: true });
    }

    // Create a new application
    const newApplication = new Application({
      jobid,
      jobname,
      applicantid,
      applicantname,
      applicantemail,
      applicantskills: applicantSkills,
      phonenumber,
      managerid,
      status: "applied",  // Set initial status to "applied"
    });

    await newApplication.save();
    return res.status(200).json({ message: "Application saved successfully", data: newApplication });
  } catch (error) {
    console.error("Error saving application:", error);
    return res.status(500).json({ message: "Error saving application", error: true });
  }
};

const { body, validationResult } = require("express-validator");
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(422).json({ errors: errorMessages });
  }
  next();
};

//Group 49
module.exports.notifyNewJob = async function (req, res) {
  try {
    console.log("Hello");
    const job = await Job.findOne({ name: req.body.jobName });
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const applicants = await User.find({ role: "Applicant" });
    if (applicants.length === 0) {
      return res.status(404).json({ message: "No applicants found to notify" });
    }
    console.log(applicants);
    const notifications = applicants.map(async (applicant) => {
      const mailOptions = {
        from: "stallap@ncsu.edu",
        to: applicant.email,
        subject: "New Job Opportunity Available",
        html: `<p>Dear Applicant,</p>
             <p>A new job for the position of <strong>${req.body.jobName}</strong> has been posted. You can check out more details on the job portal.</p>
             <p>Best regards,<br/>Job Portal Team</p>`,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(notifications);

    res.status(200).json({
      message: "New job notifications sent to applicants successfully",
    });
  } catch (error) {
    console.error("Error notifying applicants about new job:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
