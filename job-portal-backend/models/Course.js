// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: { type: Number, default: 0 },
  content: [String], // simple array of lessons/URLs
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
