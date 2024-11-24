const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  managerid: {
    type: String,
    required: true,
  },
  managerAffilication: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "open",
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  pay: {
    type: String,
    required: true,
  },
  requiredSkills: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  // question1: {
  //   type: String,
  //   required: true,
  // },
  // question2: {
  //   type: String,
  //   required: true,
  // },
  // question3: {
  //   type: String,
  //   required: true,
  // },
  // question4: {
  //   type: String,
  //   required: true,
  // },
  questions: {
    type: [String],
    default: [],
    required: true,
  },
  saved: {
    type: Boolean,
    deafult: false,
  },
});

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
