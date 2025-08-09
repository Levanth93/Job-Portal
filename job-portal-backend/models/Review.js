const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  type: { type: String, enum: ['mentor', 'course', 'challenge', 'internship'], required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  feedback: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
