const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, roleCheck } = require('../middlewares/authMiddleware');

// Protect all user routes
router.use(authMiddleware, roleCheck('user'));

/* ----------------- DASHBOARD ----------------- */
router.get('/dashboard', userController.getDashboard);

/* ----------------- COURSES ----------------- */
router.get('/courses', userController.listCourses);
router.post('/courses/:courseId/enroll', userController.enrollCourse);
router.get('/courses/progress', userController.getCourseProgress);

/* ----------------- JOBS ----------------- */
router.get('/jobs', userController.listJobs);
router.post('/jobs/:jobId/apply', userController.applyJob);
router.post('/jobs/:jobId/bookmark', userController.bookmarkJob);

/* ----------------- MENTORSHIP ----------------- */
router.get('/mentors', userController.listMentors);
router.post('/mentors/book', userController.bookMentor);

/* ----------------- TESTS ----------------- */
router.get('/tests', userController.listTests);
router.get('/tests/:testId/start', userController.startTest);
router.post('/tests/:testId/submit', userController.submitTest);

/* ----------------- CHALLENGES ----------------- */
router.get('/challenges/daily', userController.listDailyChallenges);
router.get('/challenges/weekly', userController.listWeeklyChallenges);
router.post('/challenges/:challengeId/submit', userController.submitChallenge);

/* ----------------- INTERNSHIPS ----------------- */
router.get('/internships', userController.listInternships);
router.post('/internships/:internId/apply', userController.applyInternship);

/* ----------------- RECOMMENDATIONS ----------------- */
router.get('/recommendations', userController.recommendations);

/* ----------------- NOTIFICATIONS ----------------- */
router.get('/notifications', userController.getNotifications);

/* ----------------- ANALYTICS ----------------- */
router.get('/analytics', userController.analytics);

/* ----------------- RESUME BUILDER ----------------- */
router.post('/resume', userController.saveResume);
router.get('/resume', userController.getResume);

module.exports = router;
