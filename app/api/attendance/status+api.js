import mongoose from 'mongoose';
import connectDB from '../../../lib/db';
import AttendanceLog from '../../../models/AttendanceLog';

function getKarachiDate() {
  const options = { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(new Date());
}

function formatTime(dateObj) {
  if (!dateObj) return '--:--';
  const d = new Date(dateObj);
  return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: true });
}

export async function GET(request) {
  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1 || AttendanceLog.db.readyState !== 1) {
      throw new Error('MongoDB connection is not ready for AttendanceLog query.');
    }
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    if (!employeeId) return Response.json({ success: false, message: 'Employee ID is required' }, { status: 400 });
    const todayDate = getKarachiDate();
    const attendance = await AttendanceLog.findOne({ employeeId, date: todayDate });
    if (!attendance) return Response.json({ success: true, state: 'checked_out', totalHours: '00h 00m', lastCheckIn: '--:--', lastCheckOut: '--:--', data: { status: 'checked_out', date: todayDate, checkIn: null, checkOut: null } });
    const lastCheckInStr = attendance.checkIn?.time ? formatTime(attendance.checkIn.time) : '--:--';
    const lastCheckOutStr = attendance.checkOut?.time ? formatTime(attendance.checkOut.time) : '--:--';
    const durationMinutes = attendance.checkOut?.durationMinutes ?? 0;
    return Response.json({ success: true, state: attendance.status, totalHours: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`, lastCheckIn: lastCheckInStr, lastCheckOut: lastCheckOutStr, data: attendance });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}