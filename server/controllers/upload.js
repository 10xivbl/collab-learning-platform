const { cloudinary } = require('../config/cloudinary');

//    Upload single file
// @access  Private (Teachers only)
exports.uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    console.log('File uploaded:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename
    });

    // Generate proper download URL with attachment flag
    let fileUrl = req.file.path;
    
    // For PDFs and other raw files, ensure download URL is properly formatted
    if (req.file.mimetype === 'application/pdf' || !req.file.mimetype.startsWith('image/')) {
      const publicId = req.file.filename;
      fileUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        flags: 'attachment',
        secure: true
      });
      console.log('Generated download URL for non-image file:', fileUrl);
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        fileName: req.file.originalname,
        fileUrl: fileUrl,
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

//  Upload multiple files
// @access  Private (Teachers only)
exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one file'
      });
    }

    const files = req.files.map(file => {
      // Generate proper download URL with attachment flag
      let fileUrl = file.path;
      
      // For PDFs and other raw files, ensure download URL is properly formatted
      if (file.mimetype === 'application/pdf' || !file.mimetype.startsWith('image/')) {
        const publicId = file.filename;
        fileUrl = cloudinary.url(publicId, {
          resource_type: 'raw',
          flags: 'attachment',
          secure: true
        });
      }

      return {
        fileName: file.originalname,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        publicId: file.filename
      };
    });

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

//    Get file info
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

// @desc    Generate download URL for a file
// @access  Private
exports.getDownloadUrl = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { fileName } = req.query;
    
    // Generate a download URL with proper flags
    let downloadUrl;
    
    try {
      // Try to get resource info to determine type
      const resource = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
      
      // Generate URL with attachment flag
      downloadUrl = cloudinary.url(publicId, {
        resource_type: 'raw',
        flags: 'attachment:' + (fileName || resource.public_id),
        secure: true
      });
    } catch (rawError) {
      // If not raw, try as image
      try {
        const resource = await cloudinary.api.resource(publicId, { resource_type: 'image' });
        downloadUrl = cloudinary.url(publicId, {
          resource_type: 'image',
          flags: 'attachment:' + (fileName || resource.public_id),
          secure: true
        });
      } catch (imageError) {
        throw new Error('File not found in Cloudinary');
      }
    }

    res.status(200).json({
      success: true,
      downloadUrl
    });
  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating download URL',
      error: error.message
    });
  }
};