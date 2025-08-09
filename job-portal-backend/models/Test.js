// models/Test.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  q: String,
  options: [String],
  correctIndex: Number
});

const testSchema = new mongoose.Schema({
  title: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  questions: [questionSchema],
  leaderboard: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, score: Number }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', testSchema);
