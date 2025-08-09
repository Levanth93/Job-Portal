// models/Resume.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  data: mongoose.Schema.Types.Mixed, // store resume JSON data
  pdfUrl: String,
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);
