import connectDB from '../../../lib/db';
import AttendanceLog from '../../../models/AttendanceLog';

const OFFICE_LAT = parseFloat(process.env.OFFICE_LAT || '30.20323'); 
const OFFICE_LNG = parseFloat(process.env.OFFICE_LNG || '71.51481');
const ALLOWED_RADIUS_METERS = 500;

function getKarachiDate() {
  const options = { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(new Date());
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { employeeId, action, coordinates } = body;

    if (!employeeId || !action || !coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
      return Response.json({ success: false, message: 'Invalid payload. employeeId, action, and valid coordinates are required.' }, { status: 400 });
    }
    if (!['IN', 'OUT'].includes(action)) {
      return Response.json({ success: false, message: 'Invalid action. Must be IN or OUT.' }, { status: 400 });
    }

    const distance = calculateDistance(coordinates.latitude, coordinates.longitude, OFFICE_LAT, OFFICE_LNG);
    if (distance > ALLOWED_RADIUS_METERS) {
      return Response.json({ success: false, message: `You are outside the office radius. Distance: ${Math.round(distance)}m (Allowed: ${ALLOWED_RADIUS_METERS}m).` }, { status: 403 });
    }

    const todayDate = getKarachiDate();
    const now = new Date();

    let attendance = await AttendanceLog.findOne({ employeeId, date: todayDate });

    if (action === 'IN') {
      // Check if there is already an active session without checkout
      if (attendance && attendance.sessions && attendance.sessions.some(s => !s.checkOutTime)) {
        return Response.json({ success: false, message: 'Employee is already checked in. Please check out first.' }, { status: 400 });
      }

      const newCheckInData = {
        time: now,
        coordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude },
        distanceFromOffice: Math.round(distance)
      };

      if (!attendance) {
        try {
          attendance = await AttendanceLog.create({
            employeeId,
            date: todayDate,
            status: 'checked_in',
            checkIn: newCheckInData,
            sessions: [{ checkInTime: now, checkOutTime: null, durationMinutes: 0 }]
          });
        } catch (err) {
          if (err.code === 11000) {
            // Race condition handle using findOneAndUpdate
            attendance = await AttendanceLog.findOne({ employeeId, date: todayDate });
          } else {
            throw err;
          }
        }
      }

      // If document already existed for today, push a clean new session
      if (attendance) {
        attendance.status = 'checked_in';
        attendance.checkIn = newCheckInData;
        if (!attendance.sessions) attendance.sessions = [];
        attendance.sessions.push({ checkInTime: now, checkOutTime: null, durationMinutes: 0 });
        await attendance.save();
      }

      return Response.json({ success: true, message: 'Checked in successfully', data: attendance });

    } else if (action === 'OUT') {
      if (!attendance || !attendance.sessions || attendance.sessions.length === 0) {
        return Response.json({ success: false, message: 'No active check-in session found to check out from.' }, { status: 400 });
      }

      // Find the latest active session that has not checked out yet
      const activeSession = attendance.sessions.slice().reverse().find(s => !s.checkOutTime);
      
      if (!activeSession) {
        return Response.json({ success: false, message: 'No active check-in session found. You are already checked out.' }, { status: 400 });
      }

      const checkInTime = new Date(activeSession.checkInTime);
      const durationMinutes = Math.round((now - checkInTime) / (1000 * 60));

      // Update the active session details
      activeSession.checkOutTime = now;
      activeSession.durationMinutes = durationMinutes;

      attendance.status = 'checked_out';
      attendance.checkOut = {
        time: now,
        coordinates: { latitude: coordinates.latitude, longitude: coordinates.longitude },
        distanceFromOffice: Math.round(distance),
        durationMinutes
      };

      await attendance.save();
      return Response.json({ success: true, message: 'Checked out successfully', data: attendance });
    }

  } catch (error) {
    console.error('Attendance API Error:', error);
    return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}