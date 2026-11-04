// models/AttendanceLog.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String, // Changed to String to seamlessly support both custom IDs and ObjectIds
    required: true,
    index: true,
  },
  date: {
    type: String, // Format: 'YYYY-MM-DD' in Asia/Karachi timezone
    required: true,
  },
  status: {
    type: String,
    enum: ['checked_in', 'checked_out'],
    default: 'checked_out',
  },
  checkIn: {
    time: { type: Date },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    distanceFromOffice: { type: Number }, // in meters
  },
  checkOut: {
    time: { type: Date },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    distanceFromOffice: { type: Number }, // in meters
    durationMinutes: { type: Number },
  },
  sessions: [
    {
      checkInTime: Date,
      checkOutTime: Date,
      durationMinutes: Number,
    }
  ]
}, {
  timestamps: true,
});

// Enforce unique record per employee per date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.models.AttendanceLog || mongoose.model('AttendanceLog', attendanceSchema);