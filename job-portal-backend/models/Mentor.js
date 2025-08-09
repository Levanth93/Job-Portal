// models/Mentor.js
const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  name: String,
  bio: String,
  skills: [String],
  availableSlots: [Date],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mentor', mentorSchema);
