const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true
  },
  expectedAttendees: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  qrCode: {
    type: String,
    default: null
  },
  qrCodeImage: {
    type: String,
    default: null
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  actualUsageDuration: {
    type: Number,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: null
  },
  staffRecommendation: {
    type: String,
    enum: ['no_recommendation', 'recommend_approve', 'recommend_reject'],
    default: 'no_recommendation'
  },
  staffComment: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  noShowCount: {
    type: Number,
    default: 0,
    description: 'Number of no-shows for the booking user (incremented when booking not checked-in)'
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

// Update timestamp
bookingSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Indexes for performance
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ resourceId: 1, status: 1 });
bookingSchema.index({ startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1, startTime: 1 });

// Method to check if booking can be cancelled
bookingSchema.methods.canCancel = function() {
  const now = new Date();
  const hoursDifference = (this.startTime - now) / (1000 * 60 * 60);
  return hoursDifference > 0 && ['pending', 'approved'].includes(this.status);
};

module.exports = mongoose.model('Booking', bookingSchema);
