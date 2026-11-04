import connectDB from '../../../lib/db';
import AttendanceLog from '../../../models/AttendanceLog';

// Helper to format minutes into 'XXh YYm'
function formatMinutesToHours(totalMinutes) {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
}

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');

        if (!employeeId) {
            return Response.json({ success: false, message: 'Employee ID is required' }, { status: 400 });
        }

        // Fetch all logs for this employee from database
        const logs = await AttendanceLog.find({ employeeId }).sort({ date: -1 }).lean();

        const formattedLogs = logs.map(log => {
            // Calculate total hours worked from sessions
            let dayTotalMinutes = 0;
            const sessions = log.sessions || [];
            
            sessions.forEach(s => {
                if (s.durationMinutes) {
                    dayTotalMinutes += s.durationMinutes;
                } else if (s.checkInTime && s.checkOutTime) {
                    const diff = Math.round((new Date(s.checkOutTime) - new Date(s.checkInTime)) / (1000 * 60));
                    if (diff > 0) dayTotalMinutes += diff;
                }
            });

            // Determine status based on log state
            let status = log.status === 'checked_in' ? 'Present' : (dayTotalMinutes > 0 ? 'Present' : 'Absent');
            
            // Agar weekend ya off ho toh schema/logic ke mutabiq handle karein
            const logDateObj = new Date(log.date);
            const isWeekend = logDateObj.getDay() === 0 || logDateObj.getDay() === 6;
            if (!log.sessions || log.sessions.length === 0) {
                status = isWeekend ? 'Weekly off' : 'Absent';
            }

            return {
                id: log._id,
                date: log.date, // Format: 'YYYY-MM-DD'
                status: status,
                hours: dayTotalMinutes > 0 ? formatMinutesToHours(dayTotalMinutes) : '—',
                sessions: sessions
            };
        });

        // Calculate Monthly aggregate statistics
        let present = 0;
        let absent = 0;
        let halfDay = 0;
        let workingDays = formattedLogs.length;
        let totalMonthlyMinutes = 0;

        formattedLogs.forEach(log => {
            if (log.status === 'Present') {
                present++;
                // Parse hours to sum total monthly duration
                if (log.hours !== '—') {
                    const match = log.hours.match(/(\d+)h\s*(\d+)m/);
                    if (match) {
                        totalMonthlyMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
                    }
                }
            } else if (log.status === 'Absent') {
                absent++;
            } else if (log.status === 'Half day') {
                halfDay++;
            }
        });

        const stats = {
            present,
            absent,
            halfDay,
            workingDays,
            totalHours: formatMinutesToHours(totalMonthlyMinutes)
        };

        return Response.json({
            success: true,
            logs: formattedLogs,
            stats
        });

    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}