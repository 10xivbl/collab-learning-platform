const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an assignment title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide an assignment description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: [true, 'Assignment must belong to a classroom']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  totalPoints: {
    type: Number,
    required: [true, 'Please provide total points'],
    min: [0, 'Points cannot be negative'],
    default: 100
  },
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  instructions: {
    type: String,
    maxlength: [5000, 'Instructions cannot exceed 5000 characters']
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    min: [0, 'Penalty cannot be negative'],
    max: [100, 'Penalty cannot exceed 100%'],
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date
  }
});

// update timestamp before saving
assignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  next();
});

// virtual for checking if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status !== 'closed';
});

// virtual for days until due
assignmentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const diff = this.dueDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// ensure virtuals are included in JSON
assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);