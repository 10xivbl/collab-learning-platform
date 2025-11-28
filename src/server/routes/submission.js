const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getAssignmentSubmissions,
  getMySubmission,
  gradeSubmission,
  getStudentSubmissions,
  deleteSubmission
} = require('../controllers/submission');
const { protect, authorize } = require('../middleware/auth');

// all routes require authentication
router.use(protect);

// student creates/updates submission
router.post('/', authorize('student'), createSubmission);

// get all submissions for an assignment (teacher only)
router.get('/assignment/:assignmentId', authorize('teacher'), getAssignmentSubmissions);

// get student's own submission for an assignment
router.get('/assignment/:assignmentId/my-submission', authorize('student'), getMySubmission);

// grade a submission (teacher only)
router.put('/:id/grade', authorize('teacher'), gradeSubmission);

// get all submissions by a student in a classroom
router.get('/classroom/:classroomId/student/:studentId', getStudentSubmissions);

// delete submission (student only, before grading)
router.delete('/:id', authorize('student'), deleteSubmission);

module.exports = router;