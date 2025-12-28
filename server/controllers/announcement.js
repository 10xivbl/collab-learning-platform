const Announcement = require('../models/Announcement');
const Classroom = require('../models/Classroom');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, classroom } = req.body;
    if (!title || !content || !classroom) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }
    // Only teacher of the class can create
    const classDoc = await Classroom.findById(classroom);
    if (!classDoc || classDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const announcement = await Announcement.create({
      title,
      content,
      classroom,
      createdBy: req.user.id
    });
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
