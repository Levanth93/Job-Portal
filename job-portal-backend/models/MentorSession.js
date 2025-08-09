// models/MentorSession.js
const mongoose = require('mongoose');

const mentorSessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  time: { type: Date, required: true },
  notes: String,
  status: { type: String, enum: ['Booked','Completed','Cancelled'], default: 'Booked' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MentorSession', mentorSessionSchema);
