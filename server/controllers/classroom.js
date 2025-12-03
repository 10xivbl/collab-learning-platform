const Classroom = require('../models/Classroom');
const User = require('../models/User');

// @desc    Create new classroom
// @route   POST /api/classrooms
// @access  Private (Teacher only)
exports.createClassroom = async (req, res) => {
  try {
    const { name, description, subject } = req.body;

    // Validate required fields
    if (!name || !description || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, and subject'
      });
    }

    // Check if user is a teacher
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create classrooms'
      });
    }

    // Create classroom
    const classroom = await Classroom.create({
      name,
      description,
      subject,
      teacher: req.user.id
    });

    // Add classroom to teacher's classrooms array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { classrooms: classroom._id }
    });

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      classroom
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating classroom',
      error: error.message
    });
  }
};

// @desc    Get all classrooms for current user
// @route   GET /api/classrooms
// @access  Private
exports.getClassrooms = async (req, res) => {
  try {
    let classrooms;

    if (req.user.role === 'teacher') {
      // Get classrooms where user is the teacher
      classrooms = await Classroom.find({ teacher: req.user.id })
        .populate('students', 'username email firstName lastName')
        .populate('teacher', 'username email firstName lastName')
        .sort('-createdAt');
    } else {
      // Get classrooms where user is a student
      classrooms = await Classroom.find({ students: req.user.id })
        .populate('teacher', 'username email firstName lastName')
        .sort('-createdAt');
    }

    res.status(200).json({
      success: true,
      count: classrooms.length,
      classrooms
    });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classrooms',
      error: error.message
    });
  }
};

// @desc    Get single classroom by ID
// @route   GET /api/classrooms/:id
// @access  Private
exports.getClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('teacher', 'username email firstName lastName')
      .populate('students', 'username email firstName lastName')
      .populate('announcements.author', 'username firstName lastName')
      .populate('materials.uploadedBy', 'username firstName lastName');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if user has access to this classroom
    const isTeacher = classroom.teacher._id.toString() === req.user.id;
    const isStudent = classroom.students.some(
      student => student._id.toString() === req.user.id
    );

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this classroom'
      });
    }

    res.status(200).json({
      success: true,
      classroom
    });
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classroom',
      error: error.message
    });
  }
};

// @desc    Update classroom
// @route   PUT /api/classrooms/:id
// @access  Private (Teacher only)
exports.updateClassroom = async (req, res) => {
  try {
    let classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // Check if user is the teacher of this classroom
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the classroom teacher can update it'
      });
    }

    // Update classroom
    classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Classroom updated successfully',
      classroom
    });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating classroom',
      error: error.message
    });
  }
};

// @desc    Delete classroom
// @route   DELETE /api/classrooms/:id
// @access  Private (Teacher only)
exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // check if user is the teacher of this classroom
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the classroom teacher can delete it'
      });
    }

    // remove classroom from all users' classrooms array
    await User.updateMany(
      { classrooms: classroom._id },
      { $pull: { classrooms: classroom._id } }
    );

    await classroom.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting classroom',
      error: error.message
    });
  }
};

// @desc    Join classroom with class code
// @route   POST /api/classrooms/join
// @access  Private (Student only)
exports.joinClassroom = async (req, res) => {
  try {
    const { classCode } = req.body;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a class code'
      });
    }

    // find classroom by code
    const classroom = await Classroom.findOne({ classCode: classCode.toUpperCase() });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Invalid class code'
      });
    }

    // check if user is already in the classroom
    if (classroom.students.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this classroom'
      });
    }

    // check if user is the teacher
    if (classroom.teacher.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You are the teacher of this classroom'
      });
    }

    // add student to classroom
    classroom.students.push(req.user.id);
    await classroom.save();

    // add classroom to user's classrooms array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { classrooms: classroom._id }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully joined classroom',
      classroom
    });
  } catch (error) {
    console.error('Join classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining classroom',
      error: error.message
    });
  }
};

// @desc    Leave classroom
// @route   POST /api/classrooms/:id/leave
// @access  Private (Student only)
exports.leaveClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // check if user is in the classroom
    if (!classroom.students.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this classroom'
      });
    }

    // remove student from classroom
    classroom.students = classroom.students.filter(
      student => student.toString() !== req.user.id
    );
    await classroom.save();

    // remove classroom from user's classrooms array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { classrooms: classroom._id }
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left classroom'
    });
  } catch (error) {
    console.error('Leave classroom error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving classroom',
      error: error.message
    });
  }
};