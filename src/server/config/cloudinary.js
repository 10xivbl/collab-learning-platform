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
  params: {
    folder: 'collab-learning/assignments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'],
    resource_type: 'auto',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `assignment-${uniqueSuffix}`;
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

// create multer upload instance
const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

module.exports = {
  cloudinary,
  uploadAssignment
};