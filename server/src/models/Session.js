const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      default: null, // null while lamp is currently ON
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active sessions for a device quickly
sessionSchema.index({ deviceId: 1, endTime: 1 });
sessionSchema.index({ deviceId: 1, startTime: -1 });

module.exports = mongoose.model('Session', sessionSchema);
