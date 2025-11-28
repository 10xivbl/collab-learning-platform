const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Submission must belong to an assignment']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submission must have a student']
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  content: {
    type: String,
    maxlength: [10000, 'Submission content cannot exceed 10000 characters']
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
  status: {
    type: String,
    enum: ['draft', 'submitted', 'graded', 'returned'],
    default: 'draft'
  },
  submittedAt: {
    type: Date
  },
  grade: {
    type: Number,
    min: [0, 'Grade cannot be negative'],
  },
  feedback: {
    type: String,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateByDays: {
    type: Number,
    default: 0
  },
  penaltyApplied: {
    type: Number,
    default: 0
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

// prevent duplicate submissions (one student can only submit once per assignment)
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// update timestamp and check if late before saving
submissionSchema.pre('save', async function(next) {
  try {
    this.updatedAt = Date.now();

    // if status is changing to 'submitted', set submittedAt and check if late
    if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
      this.submittedAt = Date.now();

      // populate assignment to check due date
      await this.populate('assignment');
      
      if (this.assignment && this.assignment.dueDate) {
        const dueDate = new Date(this.assignment.dueDate);
        const submitDate = new Date(this.submittedAt);

        if (submitDate > dueDate) {
          this.isLate = true;
          
          // Calculate days late
          const diffTime = Math.abs(submitDate - dueDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          this.lateByDays = diffDays;

          // Apply penalty if configured
          if (this.assignment.lateSubmissionPenalty > 0) {
            this.penaltyApplied = this.assignment.lateSubmissionPenalty * diffDays;
          }
        }
      }
    }

    // if graded, set gradedAt timestamp
    if (this.isModified('grade') && this.grade !== undefined && !this.gradedAt) {
      this.gradedAt = Date.now();
      if (this.status === 'submitted') {
        this.status = 'graded';
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// final grade after penalty
submissionSchema.virtual('finalGrade').get(function() {
  if (this.grade === undefined || this.grade === null) {
    return null;
  }
  
  const penalty = this.penaltyApplied || 0;
  const finalGrade = Math.max(0, this.grade - penalty);
  return Math.round(finalGrade * 100) / 100; // Round to 2 decimal places
});

// grade percentage
submissionSchema.virtual('gradePercentage').get(function() {
  if (this.finalGrade === null) {
    return null;
  }
  
  // this requires assignment to be populated
  if (this.assignment && this.assignment.totalPoints) {
    return Math.round((this.finalGrade / this.assignment.totalPoints) * 100);
  }
  
  return null;
});

// ensure virtuals are included in JSON
submissionSchema.set('toJSON', { virtuals: true });
submissionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Submission', submissionSchema);