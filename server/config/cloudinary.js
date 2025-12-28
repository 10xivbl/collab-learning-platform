const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// configure storage for assignment materials (teachers only)
const assignmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const isPdf = file.mimetype === 'application/pdf';
    const isImage = file.mimetype.startsWith('image/');
    
    const baseParams = {
      folder: 'collab-learning/assignments',
      access_mode: 'public',
      type: 'upload',
      public_id: `assignment-${uniqueSuffix}`,
    };
    
    if (isImage) {
      // For images, use image resource type with allowed formats
      return {
        ...baseParams,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png']
      };
    } else {
      // For raw files (PDF, DOC, etc), don't use allowed_formats
      return {
        ...baseParams,
        resource_type: 'raw',
        flags: isPdf ? 'attachment' : undefined
      };
    }
  }
});

// file filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`), false);
  }
};

// configure storage for submission files (students)
const submissionStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const isPdf = file.mimetype === 'application/pdf';
    const isImage = file.mimetype.startsWith('image/');
    
    const baseParams = {
      folder: 'collab-learning/submissions',
      access_mode: 'public',
      type: 'upload',
      public_id: `submission-${uniqueSuffix}`,
    };
    
    if (isImage) {
      // For images
      return {
        ...baseParams,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png']
      };
    } else {
      // For PDFs and other docs
      return {
        ...baseParams,
        resource_type: 'raw',
        flags: isPdf ? 'attachment' : undefined
      };
    }
  }
});


// create multer upload instance
const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

const uploadSubmission = multer({
  storage: submissionStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

module.exports = {
  cloudinary,
  uploadAssignment,
  uploadSubmission
};