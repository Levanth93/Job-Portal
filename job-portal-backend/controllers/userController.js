// controllers/userController.js
const User = require('../models/User');
const Course = require('../models/Course');
const Job = require('../models/Job');
const Mentor = require('../models/Mentor');
const MentorSession = require('../models/MentorSession');
const Challenge = require('../models/Challenge');
const Internship = require('../models/Internship');
const Notification = require('../models/Notification');
const Test = require('../models/Test');
const Resume = require('../models/Resume');
const mongoose = require('mongoose');

/**
 * 1) Register/Login handled globally in auth module.
 * Here we assume req.user contains { id, role, email }
 */

/* ----------------------------- DASHBOARD ----------------------------- */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password').lean();

    // Course progress: calculate percent = (#enrolled completed lessons / total) - simplified
    const enrolledCount = (user.enrolledCourses || []).length;

    // Internship progress: count applied internships by tasks completed - simplified as 0
    // Next mentor session
    const nextSession = await MentorSession.findOne({ user: userId, status: 'Booked', time: { $gte: new Date() } }).populate('mentor').sort({ time: 1 });

    // Applied jobs count
    const appliedJobsCount = (user.appliedJobs || []).length;

    // Challenges completed this week (placeholder)
    // For demo: count notifications of type challenge (this is simplistic)
    const weeklyChallengesCompleted = await Challenge.countDocuments({ type: 'weekly', deadline: { $gte: new Date(Date.now() - 7*24*3600*1000) } });

    return res.json({
      welcome: user.name,
      courseProgress: `${enrolledCount} enrolled`,
      internship: 'See internships',
      appliedJobs: appliedJobsCount,
      interviews: 0,
      nextMentorship: nextSession ? nextSession.time : null,
      weeklyChallengesCompleted
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* ----------------------------- COURSES ----------------------------- */

/**
 * Get courses: implement "weekly one randomly free" by deterministic choice
 * We'll choose based on ISO week number so same course is free for the whole week.
 */
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
}

exports.listCourses = async (req, res) => {
  try {
    const courses = await Course.find().lean();
    if (!courses.length) return res.json([]);

    const week = getWeekNumber(new Date());
    const index = week % courses.length;
    const coursesWithFree = courses.map((c, i) => ({ ...c, isFreeThisWeek: i === index }));
    return res.json(coursesWithFree);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;
    await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } });
    return res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getCourseProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('enrolledCourses').lean();
    // Simplified progress: list of enrolled course titles
    return res.json({ enrolledCourses: user.enrolledCourses || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- JOBS ----------------------------- */
exports.listJobs = async (req, res) => {
  try {
    const jobs = await Job.find().lean();
    return res.json(jobs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.applyJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // avoid duplicates
    if (job.applicants.includes(userId)) return res.status(400).json({ message: 'Already applied' });

    job.applicants.push(userId);
    await job.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { appliedJobs: jobId } });

    // send notification (in-app)
    await Notification.create({ user: userId, title: 'Application Submitted', message: `Applied to ${job.title}` });

    return res.json({ message: 'Applied successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.bookmarkJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;
    await User.findByIdAndUpdate(userId, { $addToSet: { bookmarks: jobId } });
    return res.json({ message: 'Bookmarked' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- MENTORSHIP ----------------------------- */
exports.listMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find().lean();
    return res.json(mentors);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.bookMentor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mentorId, time } = req.body;
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const session = await MentorSession.create({
      mentor: mentorId,
      user: userId,
      time: new Date(time)
    });

    // push to mentor's sessions (if desired)
    // send notification
    await Notification.create({ user: userId, title: 'Mentor booked', message: `Session with ${mentor.name} booked at ${session.time}` });

    return res.status(201).json({ message: 'Mentor booked', session });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- MOCK INTERVIEWS / TESTS ----------------------------- */
exports.listTests = async (req, res) => {
  try {
    const tests = await Test.find().lean();
    return res.json(tests);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// start test returns test details (questions)
exports.startTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).select('-leaderboard').lean();
    if (!test) return res.status(404).json({ message: 'Test not found' });
    return res.json(test);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// submit test: calculate score, update leaderboard
exports.submitTest = async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId(req.user.id);
    const testId = req.params.testId;
    const answers = req.body.answers || []; // expect array of selected indices e.g. [0,2,1]
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    let score = 0;
    for (let i=0;i<test.questions.length;i++){
      if (typeof answers[i] !== 'undefined' && answers[i] === test.questions[i].correctIndex) score++;
    }
    const percent = Math.round((score / test.questions.length) * 100);

    // update leaderboard: remove previous entry if exists
    test.leaderboard = test.leaderboard.filter(e => !e.user.equals(userId));
    test.leaderboard.push({ user: userId, score: percent });
    // sort desc and keep top 50
    test.leaderboard.sort((a,b) => b.score - a.score);
    test.leaderboard = test.leaderboard.slice(0,50);
    await test.save();

    // notify user
    await Notification.create({ user: req.user.id, title: 'Test submitted', message: `You scored ${percent}% in ${test.title}` });

    return res.json({ percent, message: 'Submitted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- CHALLENGES ----------------------------- */

exports.listDailyChallenges = async (req, res) => {
  try {
    const list = await Challenge.find({ type: 'daily' }).lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.listWeeklyChallenges = async (req, res) => {
  try {
    const list = await Challenge.find({ type: 'weekly' }).lean();
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.submitChallenge = async (req, res) => {
  try {
    // For simplicity, store submission as a notification to admin/mentor - extend with ChallengeSubmission model
    const challengeId = req.params.challengeId;
    await Notification.create({ user: req.user.id, title: 'Challenge submitted', message: `Submitted challenge ${challengeId}` });
    return res.json({ message: 'Submitted (placeholder)' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- INTERNSHIPS ----------------------------- */
exports.listInternships = async (req, res) => {
  try {
    const items = await Internship.find().lean();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.applyInternship = async (req, res) => {
  try {
    // simplified: mark user in task.completedBy for first task as example
    const internshipId = req.params.internId;
    const internship = await Internship.findById(internshipId);
    if (!internship) return res.status(404).json({ message: 'Internship not found' });

    // For demo: mark first task completedBy user
    if (internship.tasks && internship.tasks.length) {
      internship.tasks[0].completedBy = internship.tasks[0].completedBy || [];
      if (!internship.tasks[0].completedBy.includes(req.user.id)) {
        internship.tasks[0].completedBy.push(req.user.id);
        await internship.save();
      }
    }
    await Notification.create({ user: req.user.id, title: 'Internship applied', message: `Applied to ${internship.title}` });
    return res.json({ message: 'Applied to internship (placeholder)' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- RECOMMENDATIONS ----------------------------- */

exports.recommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    // Simple rule-based recommender: match user's skills to course titles & job descriptions
    const skills = user.skills || [];
    const courses = await Course.find().lean();
    const jobs = await Job.find().lean();

    function scoreTextMatch(text) {
      if (!text) return 0;
      return skills.reduce((acc, s) => acc + (text.toLowerCase().includes(s.toLowerCase()) ? 1 : 0), 0);
    }

    const recommendedCourses = courses.map(c => ({ ...c, score: scoreTextMatch(c.title + ' ' + c.description) })).sort((a,b) => b.score - a.score).slice(0,5);
    const recommendedJobs = jobs.map(j => ({ ...j, score: scoreTextMatch(j.title + ' ' + j.description) })).sort((a,b) => b.score - a.score).slice(0,5);

    return res.json({ courses: recommendedCourses, jobs: recommendedJobs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- NOTIFICATIONS ----------------------------- */

exports.getNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.json(notes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- ANALYTICS ----------------------------- */

exports.analytics = async (req, res) => {
  try {
    // Simple analytics for the user
    const user = await User.findById(req.user.id).populate('enrolledCourses').lean();
    const totalCourses = (user.enrolledCourses || []).length;
    const totalApplied = (user.appliedJobs || []).length;
    const completedTasks = 0; // placeholder
    return res.json({ totalCourses, totalApplied, completedTasks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------------- RESUME BUILDER ----------------------------- */

exports.saveResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body.data; // JSON resume data
    const upsert = await Resume.findOneAndUpdate({ user: userId }, { data, updatedAt: new Date() }, { upsert: true, new: true });
    return res.json({ message: 'Resume saved', resume: upsert });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const resume = await Resume.findOne({ user: userId }).lean();
    if (!resume) return res.status(404).json({ message: 'No resume found' });
    return res.json(resume);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

