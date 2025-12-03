const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Classroom = require('../models/Classroom');

// @desc    Create or update submission
// @route   POST /api/submissions
// @access  Private (Student only)
exports.createSubmission = async (req, res) => {
  try {
    const { assignment, content, attachments, status } = req.body;

    // validate required fields
    if (!assignment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an assignment ID'
      });
    }

    // check if assignment exists and is published
    const assignmentDoc = await Assignment.findById(assignment);
    if (!assignmentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    if (assignmentDoc.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot submit to unpublished assignment'
      });
    }

    // check if student is in the classroom
    const classroom = await Classroom.findById(assignmentDoc.classroom);
    const isEnrolled = classroom.students.some(
      student => student.toString() === req.user.id
    );

    if (!isEnrolled) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this classroom'
      });
    }

    // check if late submissions are allowed
    if (!assignmentDoc.allowLateSubmission && new Date() > assignmentDoc.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'This assignment no longer accepts submissions (past due date)'
      });
    }

    // check if submission already exists (update instead of create)
    let submission = await Submission.findOne({
      assignment: assignment,
      student: req.user.id
    });

    if (submission) {
      // don't allow updates after submission is graded
      if (submission.status === 'graded' || submission.status === 'returned') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify submission after it has been graded'
        });
      }

      // update existing submission
      submission.content = content || submission.content;
      submission.attachments = attachments || submission.attachments;
      submission.status = status || submission.status;
      await submission.save();

      return res.status(200).json({
        success: true,
        message: 'Submission updated successfully',
        submission
      });
    }

    // create new submission
    submission = await Submission.create({
      assignment,
      student: req.user.id,
      classroom: assignmentDoc.classroom,
      content,
      attachments: attachments || [],
      status: status || 'draft'
    });

    // add submission to assignment
    assignmentDoc.submissions.push(submission._id);
    await assignmentDoc.save();

    // populate for response
    await submission.populate([
      { path: 'assignment', select: 'title dueDate totalPoints' },
      { path: 'student', select: 'username email firstName lastName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      submission
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating submission',
      error: error.message
    });
  }
};

// @desc    Get all submissions for an assignment
// @route   GET /api/submissions/assignment/:assignmentId
// @access  Private (Teacher only)
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // check if assignment exists
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // check if user is the teacher
    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assignment teacher can view submissions'
      });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'username email firstName lastName')
      .populate('assignment', 'title dueDate totalPoints')
      .sort('-submittedAt');

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
};

// @desc    Get student's own submission for an assignment
// @route   GET /api/submissions/assignment/:assignmentId/my-submission
// @access  Private (Student only)
exports.getMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id
    })
      .populate('assignment', 'title description dueDate totalPoints')
      .populate('gradedBy', 'username firstName lastName');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'No submission found for this assignment'
      });
    }

    res.status(200).json({
      success: true,
      submission
    });
  } catch (error) {
    console.error('Get my submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submission',
      error: error.message
    });
  }
};

// @desc    Grade a submission
// @route   PUT /api/submissions/:id/grade
// @access  Private (Teacher only)
exports.gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(req.params.id)
      .populate('assignment');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // check if user is the teacher
    if (submission.assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assignment teacher can grade submissions'
      });
    }

    // validate grade
    if (grade !== undefined) {
      if (grade < 0 || grade > submission.assignment.totalPoints) {
        return res.status(400).json({
          success: false,
          message: `Grade must be between 0 and ${submission.assignment.totalPoints}`
        });
      }
    }

    // update submission
    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedBy = req.user.id;
    submission.status = 'graded';
    await submission.save();

    // populate for response
    await submission.populate([
      { path: 'student', select: 'username email firstName lastName' },
      { path: 'assignment', select: 'title totalPoints' },
      { path: 'gradedBy', select: 'username firstName lastName' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error grading submission',
      error: error.message
    });
  }
};

// @desc    Get all submissions by a student in a classroom
// @route   GET /api/submissions/classroom/:classroomId/student/:studentId
// @access  Private (Teacher or own student)
exports.getStudentSubmissions = async (req, res) => {
  try {
    const { classroomId, studentId } = req.params;

    // check if classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    // check access (teacher or own submissions)
    const isTeacher = classroom.teacher.toString() === req.user.id;
    const isOwnSubmissions = studentId === req.user.id;

    if (!isTeacher && !isOwnSubmissions) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these submissions'
      });
    }

    const submissions = await Submission.find({
      classroom: classroomId,
      student: studentId
    })
      .populate('assignment', 'title dueDate totalPoints')
      .sort('-submittedAt');

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message
    });
  }
};

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private (Student - only if not graded)
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // check if user is the student who created it
    if (submission.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own submissions'
      });
    }

    // don't allow deletion if already graded
    if (submission.status === 'graded' || submission.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submission after it has been graded'
      });
    }

    // remove from assignment
    await Assignment.findByIdAndUpdate(
      submission.assignment,
      { $pull: { submissions: submission._id } }
    );

    await submission.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting submission',
      error: error.message
    });
  }
};