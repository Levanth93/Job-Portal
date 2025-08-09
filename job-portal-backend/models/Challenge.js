// models/Challenge.js
const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['daily','weekly'], default: 'daily' },
  deadline: Date,
  points: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Challenge', challengeSchema);
