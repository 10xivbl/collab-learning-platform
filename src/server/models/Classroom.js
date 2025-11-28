const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a classroom name'],
    trim: true,
    maxlength: [100, 'Classroom name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a classroom description'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject'],
    trim: true
  },
  classCode: {
    type: String,
    unique: true,
    uppercase: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  announcements: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  materials: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    fileUrl: String,
    fileType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// generate unique class code before saving
classroomSchema.pre('save', async function(next) {
  try {
    // update timestamp
    this.updatedAt = Date.now();
    
    // only generate code for new documents
    if (!this.isNew) {
      return next();
    }

    // generate 6-character random code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // ensure code is unique
    let code = generateCode();
    let codeExists = await this.constructor.findOne({ classCode: code });
    
    while (codeExists) {
      code = generateCode();
      codeExists = await this.constructor.findOne({ classCode: code });
    }

    this.classCode = code;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Classroom', classroomSchema);