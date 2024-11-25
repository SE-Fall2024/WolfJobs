
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  fileName: {
    type: String,
    required: true
  },
  fileData: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    required: true,
    default: 'application/pdf'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }, //group49
  skills: { // New field to store extracted skills
    type: [String], 
    default: []
  }
});

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
