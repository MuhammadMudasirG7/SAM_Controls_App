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
  return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false });
}

export async function GET(request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');

    if (!employeeId) {
      return Response.json({ success: false, message: 'Employee ID is required' }, { status: 400 });
    }

    const todayDate = getKarachiDate();
    const record = await AttendanceLog.findOne({ employeeId, date: todayDate }).lean();

    if (!record) {
      return Response.json({ success: true, enabled: false, isUserCheckedIn: false, logs: [] });
    }

    const isUserCheckedIn = record.status === 'checked_in';

    const formattedLogs = (record.sessions || []).map((session, index) => ({
      _id: session._id || index,
      time: formatTime(session.checkInTime),
      title: "Inside site",
      distance: record.checkIn?.distanceFromOffice || 9,
      badge: 'Inside',
      type: 'in'
    })).reverse();

    return Response.json({
      success: true,
      enabled: isUserCheckedIn,
      isUserCheckedIn,
      logs: formattedLogs
    });

  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { employeeId, enabled } = await request.json();

    if (!employeeId || typeof enabled !== 'boolean') {
      return Response.json({ success: false, message: 'Valid employeeId and enabled value are required' }, { status: 400 });
    }

    const todayDate = getKarachiDate();
    const record = await AttendanceLog.findOne({ employeeId, date: todayDate });

    if (!record || record.status !== 'checked_in') {
      return Response.json({
        success: false,
        message: 'State Violation: You must be actively checked in to toggle hourly presence tracking.',
        enabled: false,
        isUserCheckedIn: false
      }, { status: 400 });
    }

    const formattedLogs = (record.sessions || []).map((session, index) => ({
      _id: session._id || index,
      time: formatTime(session.checkInTime),
      title: "Inside site",
      distance: record.checkIn?.distanceFromOffice || 9,
      badge: 'Inside',
      type: 'in'
    })).reverse();

    return Response.json({
      success: true,
      enabled: enabled,
      isUserCheckedIn: true,
      logs: formattedLogs
    });

  } catch (error) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}