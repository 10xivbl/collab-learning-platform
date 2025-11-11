const express = require('express');
const router = express.Router();
const {
  createAssignment,
  getClassroomAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  publishAssignment
} = require('../controllers/assignment');
const { protect, authorize } = require('../middleware/auth');

// all routes require authentication
router.use(protect);

// get assignments for a specific classroom
router.get('/classroom/:classroomId', getClassroomAssignments);

// get single assignment
router.get('/:id', getAssignment);

// create assignment (teacher only)
router.post('/', authorize('teacher'), createAssignment);

// update assignment (teacher only)
router.put('/:id', authorize('teacher'), updateAssignment);

// delete assignment (teacher only)
router.delete('/:id', authorize('teacher'), deleteAssignment);

// publish assignment (teacher only)
router.put('/:id/publish', authorize('teacher'), publishAssignment);

module.exports = router;