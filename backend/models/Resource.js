const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['classroom', 'lab', 'seminar_hall', 'sports_facility', 'equipment', 'auditorium', 'library_room'],
    lowercase: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1
  },
  description: {
    type: String,
    trim: true
  },
  photos: [{
    type: String
  }],
  amenities: [{
    type: String,
    trim: true
  }],
  availability: {
    daysAvailable: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    hoursAvailable: {
      start: {
        type: String,
        required: true
      },
      end: {
        type: String,
        required: true
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
resourceSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Index for faster searches
resourceSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Resource', resourceSchema);

