const express = require('express');
const router = express.Router();
const {
  createClassroom,
  getClassrooms,
  getClassroom,
  updateClassroom,
  deleteClassroom,
  joinClassroom,
  leaveClassroom
} = require('../controllers/classroom');
const { protect, authorize } = require('../middleware/auth');

// all routes require authentication
router.use(protect);

// get all classrooms for current user
router.get('/', getClassrooms);

// join classroom with code (students)
router.post('/join', joinClassroom);

// get single classroom
router.get('/:id', getClassroom);

// create classroom (teachers only)
router.post('/', authorize('teacher'), createClassroom);

// update classroom (teachers only)
router.put('/:id', authorize('teacher'), updateClassroom);

// delete classroom (teachers only)
router.delete('/:id', authorize('teacher'), deleteClassroom);

// leave classroom (students)
router.post('/:id/leave', leaveClassroom);

module.exports = router;