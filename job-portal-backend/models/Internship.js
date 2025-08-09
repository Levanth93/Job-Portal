// models/Internship.js
const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: String,
  description: String,
  tasks: [{ title: String, description: String, dueDate: Date, completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] }],
  certificateUrl: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Internship', internshipSchema);
