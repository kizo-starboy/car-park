const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['daily', 'monthly'],
    required: true
  },
  reportDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: {
    // Summary statistics
    totalCarsParked: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }, // in minutes
    
    // Payment breakdown
    paymentMethods: {
      cash: { type: Number, default: 0 },
      mobile_money: { type: Number, default: 0 },
      card: { type: Number, default: 0 }
    },
    
    // Slot utilization
    slotUtilization: {
      totalSlots: { type: Number, default: 0 },
      averageOccupancy: { type: Number, default: 0 },
      peakOccupancy: { type: Number, default: 0 }
    },
    
    // Time analysis
    peakHours: [{
      hour: Number,
      count: Number
    }],
    
    // Detailed records for reference
    recordIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingRecord'
    }]
  },
  signature: {
    signedBy: {
      type: String,
      trim: true
    },
    signedAt: {
      type: Date
    },
    signatureData: {
      type: String // Base64 encoded signature image
    },
    position: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'generated', 'signed', 'archived'],
    default: 'generated'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ reportType: 1, reportDate: -1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', reportSchema);
