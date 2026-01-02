const Assignment = require('../models/Assignment');
const Classroom = require('../models/Classroom');
const { createNotification } = require('./notification');

// Helper function to fix Cloudinary URLs for proper downloads
const fixCloudinaryUrl = (fileUrl) => {
  if (!fileUrl) return fileUrl;
  
  // Pattern to match Cloudinary URLs
  const cloudinaryPattern = /https:\/\/res\.cloudinary\.com\/([^\/]+)\/(raw|image)\/upload\/(.+)/;
  const match = fileUrl.match(cloudinaryPattern);
  
  if (match) {
    const cloudName = match[1];
    const resourceType = match[2];
    const pathAfterUpload = match[3];
    
    // Only check for PDF files specifically by extension
    const isPdf = pathAfterUpload.toLowerCase().includes('.pdf');
    
    // Only convert to raw if it's actually a PDF uploaded as image
    const correctResourceType = (isPdf && resourceType === 'image') ? 'raw' : resourceType;
    
    // Remove any existing flags
    const cleanPath = pathAfterUpload.replace(/^fl_attachment[^\/]*\//, '');
    
    // For PDFs, add attachment flag. For images, just ensure clean URL
    if (isPdf) {
      return `https://res.cloudinary.com/${cloudName}/${correctResourceType}/upload/fl_attachment/${cleanPath}`;
    } else {
      // For images, return clean URL without attachment flag so they can be viewed
      return `https://res.cloudinary.com/${cloudName}/${correctResourceType}/upload/${cleanPath}`;
    }
  }
  
  return fileUrl;
};

// Helper function to fix attachments array
const fixAttachments = (attachments) => {
  if (!attachments || !Array.isArray(attachments)) return attachments;
  
  return attachments.map(att => ({
    ...att,
    fileUrl: fixCloudinaryUrl(att.fileUrl)
  }));
};

exports.createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      classroom,
      dueDate,
      totalPoints,
      instructions,
      allowLateSubmission,
      lateSubmissionPenalty,
      attachments
    } = req.body;

    // validate required fields
    if (!title || !description || !classroom || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, classroom, and due date'
      });
    }

    // check if classroom exists
    const classroomDoc = await Classroom.findById(classroom);
    if (!classroomDoc) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // check if user is the teacher of this classroom
    if (classroomDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the classroom teacher can create assignments'
      });
    }

    // create assignment
    const assignment = await Assignment.create({
      title,
      description,
      classroom,
      teacher: req.user.id,
      dueDate,
      totalPoints: totalPoints || 100,
      instructions,
      allowLateSubmission: allowLateSubmission || false,
      lateSubmissionPenalty: lateSubmissionPenalty || 0,
      attachments: attachments || []
    });

    // add assignment to classroom
    classroomDoc.assignments.push(assignment._id);
    await classroomDoc.save();

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
};


exports.getClassroomAssignments = async (req, res) => {
  try {
    const { classroomId } = req.params;

    // check if classroom exists and user has access
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    const isTeacher = classroom.teacher.toString() === req.user.id;
    const isStudent = classroom.students.some(
      student => student.toString() === req.user.id
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this classroom'
      });
    }

    // students only see published assignments
    const filter = { classroom: classroomId };
    if (req.user.role === 'student') {
      filter.status = 'published';
    }

    const assignments = await Assignment.find(filter)
      .populate('teacher', 'username email firstName lastName')
      .populate('classroom', 'name classCode')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacher', 'username email firstName lastName')
      .populate('classroom', 'name classCode');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // check access
    const classroom = await Classroom.findById(assignment.classroom._id);
    const isTeacher = classroom.teacher.toString() === req.user.id;
    const isStudent = classroom.students.some(
      student => student.toString() === req.user.id
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this assignment'
      });
    }

    // Students can only see published assignments
    if (req.user.role === 'student' && assignment.status !== 'published') {
      return res.status(403).json({
        success: false,
        message: 'This assignment is not published yet'
      });
    }

    // Fix attachment URLs for proper downloads
    const assignmentObj = assignment.toObject();
    assignmentObj.attachments = fixAttachments(assignmentObj.attachments);

    res.status(200).json({
      success: true,
      assignment: assignmentObj
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // check if user is the teacher who created it
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assignment creator can update it'
      });
    }

    // update assignment
    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // check if user is the teacher who created it
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assignment creator can delete it'
      });
    }

    // remove assignment from classroom
    await Classroom.findByIdAndUpdate(
      assignment.classroom,
      { $pull: { assignments: assignment._id } }
    );

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
};

exports.publishAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('classroom');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // check if user is the teacher who created it
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assignment creator can publish it'
      });
    }

    assignment.status = 'published';
    assignment.publishedAt = new Date();
    await assignment.save();

    // Get classroom with students
    const classroom = await Classroom.findById(assignment.classroom._id)
      .populate('teacher', 'firstName lastName');

    // Create notifications for all students in the classroom
    if (classroom && classroom.students && classroom.students.length > 0) {
      const teacherName = `${classroom.teacher.firstName} ${classroom.teacher.lastName}`;
      const notificationPromises = classroom.students.map(studentId => 
        createNotification(
          studentId,
          'assignment',
          `New Assignment: ${assignment.title}`,
          `${teacherName} posted a new assignment in ${classroom.name}. Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
          assignment._id,
          'Assignment',
          classroom._id
        )
      );

      await Promise.all(notificationPromises);

      // Emit socket event if io is available
      if (req.app.get('io')) {
        const io = req.app.get('io');
        classroom.students.forEach(studentId => {
          io.to(studentId.toString()).emit('notification', {
            type: 'assignment',
            title: `New Assignment: ${assignment.title}`,
            message: `${teacherName} posted a new assignment in ${classroom.name}`,
            classroomId: classroom._id,
            assignmentId: assignment._id
          });
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Assignment published successfully',
      assignment
    });
  } catch (error) {
    console.error('Publish assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing assignment',
      error: error.message
    });
  }
};