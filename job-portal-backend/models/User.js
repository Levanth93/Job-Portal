const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dateEarned: { type: Date, default: Date.now }
});

const profileSchema = new mongoose.Schema({
  bio: String,
  education: [String],
  experience: [String],
  profilePicture: String
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'employer', 'mentor', 'admin'],
    default: 'user'
  },

  skills: [String],
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  bookmarkedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  badges: [badgeSchema],
  profile: profileSchema
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
