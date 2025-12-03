const { cloudinary } = require('../config/cloudinary');

// @desc    Upload single file
// @route   POST /api/upload/assignment
// @access  Private (Teachers only)
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        fileName: req.file.originalname,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        publicId: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
};

// @desc    Upload multiple files
// @route   POST /api/upload/assignment/multiple
// @access  Private (Teachers only)
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one file'
      });
    }

    const files = req.files.map(file => ({
      fileName: file.originalname,
      fileUrl: file.path,
      fileType: file.mimetype,
      fileSize: file.size,
      publicId: file.filename
    }));

    res.status(200).json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      files
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    });
  }
};

// @desc    Delete file from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private (Teachers only)
exports.deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found or already deleted'
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// @desc    Get file info
// @route   GET /api/upload/info/:publicId
// @access  Private
exports.getFileInfo = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.api.resource(publicId);

    res.status(200).json({
      success: true,
      file: {
        publicId: result.public_id,
        format: result.format,
        fileType: result.resource_type,
        fileSize: result.bytes,
        fileUrl: result.secure_url,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching file info',
      error: error.message
    });
  }
};