const Announcement = require('../models/Announcement');
const Classroom = require('../models/Classroom');
const { createNotification } = require('./notification');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, classroom } = req.body;
    if (!title || !content || !classroom) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    // Only teacher of the class can create
    const classDoc = await Classroom.findById(classroom).populate('teacher', 'firstName lastName');
    if (!classDoc || classDoc.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const announcement = await Announcement.create({
      title,
      content,
      classroom,
      createdBy: req.user.id
    });

    // Create notifications for all students in the classroom
    const teacherName = `${classDoc.teacher.firstName} ${classDoc.teacher.lastName}`;
    const notificationPromises = classDoc.students.map(studentId => 
      createNotification(
        studentId,
        'announcement',
        `New Announcement in ${classDoc.name}`,
        `${teacherName} posted: ${title}`,
        announcement._id,
        'Announcement',
        classroom
      )
    );

    await Promise.all(notificationPromises);

    // Emit socket event if io is available
    if (req.app.get('io')) {
      const io = req.app.get('io');
      classDoc.students.forEach(studentId => {
        io.to(studentId.toString()).emit('notification', {
          type: 'announcement',
          title: `New Announcement in ${classDoc.name}`,
          message: `${teacherName} posted: ${title}`,
          classroomId: classroom,
          announcementId: announcement._id
        });
      });
    }

    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClassAnnouncements = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const announcements = await Announcement.find({ classroom: classroomId })
      .populate('createdBy', 'firstName lastName username')
      .sort('-createdAt');
    res.status(200).json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all announcements for classes the user is in
exports.getUserAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get all classroom IDs where user is teacher or student
    const classrooms = await Classroom.find({
      $or: [
        { teacher: userId },
        { students: userId }
      ]
    }).select('_id');
    const classroomIds = classrooms.map(c => c._id);
    // Get all announcements for those classrooms
    const announcements = await Announcement.find({ classroom: { $in: classroomIds } })
      .populate('createdBy', 'firstName lastName username')
      .populate('classroom', 'name')
      .sort('-createdAt');
    res.status(200).json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
