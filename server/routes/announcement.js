const express = require('express');
const router = express.Router();
const { createAnnouncement, getClassAnnouncements, getUserAnnouncements } = require('../controllers/announcement');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('teacher'), createAnnouncement);
router.get('/classroom/:classroomId', getClassAnnouncements);
router.get('/my', getUserAnnouncements);

module.exports = router;
