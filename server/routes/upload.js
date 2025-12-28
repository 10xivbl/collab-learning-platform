const express = require('express');
const router = express.Router();
const {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFileInfo,
  getDownloadUrl
} = require('../controllers/upload');
const { protect, authorize } = require('../middleware/auth');
const { uploadAssignment, uploadSubmission } = require('../config/cloudinary');

// all routes require authentication
router.use(protect);

// upload single file for assignments (teachers only)
router.post(
  '/assignment', 
  authorize('teacher'),
  uploadAssignment.single('file'),
  uploadSingle
);

// upload multiple files for assignments (teachers only)
router.post(
  '/assignment/multiple',
  authorize('teacher'),
  uploadAssignment.array('files', 5),
  uploadMultiple
);

// upload single file for submissions (students and teachers)
router.post(
  '/submission', 
  uploadSubmission.single('file'),
  uploadSingle
);

// upload multiple files for submissions (students and teachers)
router.post(
  '/submission/multiple',
  uploadSubmission.array('files', 5),
  uploadMultiple
);

// delete file (teachers only)
router.delete('/:publicId', authorize('teacher'), deleteFile);

// get file info (all authenticated users)
router.get('/info/:publicId', getFileInfo);

// get download URL for file (all authenticated users)
router.get('/download/:publicId', getDownloadUrl);

module.exports = router;