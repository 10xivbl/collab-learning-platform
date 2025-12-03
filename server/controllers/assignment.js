const Assignment = require('../models/Assignment');
const Classroom = require('../models/Classroom');

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher only)
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

    // Add assignment to classroom
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

// @desc    Get all assignments for a classroom
// @route   GET /api/assignments/classroom/:classroomId
// @access  Private
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

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
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

    res.status(200).json({
      success: true,
      assignment
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

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Teacher only)
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

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher only)
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

// @desc    Publish assignment (change status to published)
// @route   PUT /api/assignments/:id/publish
// @access  Private (Teacher only)
exports.publishAssignment = async (req, res) => {
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
        message: 'Only the assignment creator can publish it'
      });
    }

    assignment.status = 'published';
    assignment.publishedAt = new Date();
    await assignment.save();

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