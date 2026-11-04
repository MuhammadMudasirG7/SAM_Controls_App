import connectDB from '../../../lib/db';
import AttendanceLog from '../../../models/AttendanceLog';

// Helper function to get current date string in Asia/Karachi timezone ('YYYY-MM-DD')
function getKarachiDate() {
    const options = {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(new Date());
}

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

        // Fetch all logs for this employee, sorted by date descending
        const logs = await AttendanceLog.find({ employeeId }).sort({ date: -1 }).lean();

        const formattedLogs = logs.map(log => {
            // Deduplicate/Clean sessions if multiple identical check-ins were mistakenly logged
            const uniqueSessionsMap = new Map();
            (log.sessions || []).forEach(session => {
                const checkInStr = session.checkInTime ? new Date(session.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const checkOutStr = session.checkOutTime ? new Date(session.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'active';
                const uniqueKey = `${checkInStr}-${checkOutStr}`;
                
                // Keep only unique sessions or merge them cleanly
                if (!uniqueSessionsMap.has(uniqueKey)) {
                    uniqueSessionsMap.set(uniqueKey, {
                        id: session._id,
                        checkInTime: checkInStr,
                        checkOutTime: session.checkOutTime ? checkOutStr : null,
                        durationMinutes: session.durationMinutes || 0
                    });
                }
            });

            const cleanSessions = Array.from(uniqueSessionsMap.values());

            // Calculate total hours for this log day
            let dayTotalMinutes = 0;
            cleanSessions.forEach(s => {
                if (s.checkInTime && s.checkOutTime && s.checkOutTime !== 'active') {
                    const [inH, inM] = s.checkInTime.split(':').map(Number);
                    const [outH, outM] = s.checkOutTime.split(':').map(Number);
                    let diff = (outH * 60 + outM) - (inH * 60 + inM);
                    if (diff > 0) dayTotalMinutes += diff;
                }
            });

            // Determine status label based on attendance state
            let displayStatus = 'Absent';
            if (cleanSessions.length > 0) {
                const hasActive = cleanSessions.some(s => !s.checkOutTime);
                displayStatus = hasActive ? 'checked_in' : 'Present';
            }

            return {
                rawDate: log.date,
                date: log.date,
                status: displayStatus === 'Present' ? 'Present' : (displayStatus === 'checked_in' ? 'Present' : 'Absent'),
                hours: dayTotalMinutes > 0 ? formatMinutesToHours(dayTotalMinutes) : '—',
                sessions: cleanSessions
            };
        });

        // Calculate monthly statistics for current month
        const currentKarachiDateStr = getKarachiDate();
        const [currYear, currMonth] = currentKarachiDateStr.split('-').map(Number);

        let presentCount = 0;
        let absentCount = 0;
        let halfDayCount = 0;
        let workingDaysCount = 0;
        let totalMonthlyMinutes = 0;

        formattedLogs.forEach(log => {
            const [logYear, logMonth] = log.rawDate.split('-').map(Number);
            if (logYear === currYear && logMonth === currMonth) {
                workingDaysCount++;
                if (log.status === 'Present') presentCount++;
                else if (log.status === 'Absent') absentCount++;

                // Parse hours back to minutes for aggregate total
                if (log.hours !== '—') {
                    const parts = log.hours.match(/(\d+)h\s*(\d+)m/);
                    if (parts) {
                        totalMonthlyMinutes += parseInt(parts[1]) * 60 + parseInt(parts[2]);
                    }
                }
            }
        });

        const stats = {
            present: presentCount,
            absent: absentCount,
            halfDay: halfDayCount,
            workingDays: workingDaysCount,
            totalHours: formatMinutesToHours(totalMonthlyMinutes)
        };

        return Response.json({
            success: true,
            logs: formattedLogs,
            stats
        });

    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        return Response.json({ success: false, message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}