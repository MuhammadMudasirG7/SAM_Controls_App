import mongoose from 'mongoose';
import crypto from 'crypto';

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  failedAttempts: { type: Number, default: 0 },
  isLockedOut: { type: Boolean, default: false },
  
  // 🟢 Admin & User Access Controls
  role: { type: String, default: 'employee' }, // 'admin' ya 'employee'
  isBlocked: { type: Boolean, default: false }  // Admin Block/Unblock toggle
}, { timestamps: true });

EmployeeSchema.methods.hashPassword = function (plainPassword) {
  return crypto.createHash('sha256').update(plainPassword).digest('hex');
};

EmployeeSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  const hashedCandidate = crypto.createHash('sha256').update(candidatePassword).digest('hex');
  return this.password === hashedCandidate;
};

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);