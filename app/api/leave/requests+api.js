import connectDB from '../../../lib/db';
import LeaveRequest from '../../../models/LeaveRequest';

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        if (!employeeId) {
            return Response.json({ success: false, message: 'Employee ID is required.' }, { status: 400 });
        }

        const requests = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 }).lean();
        
        // Frontend design ke mutabiq data map karna
        const formattedRequests = requests.map(req => {
            const statusCapitalized = req.status.charAt(0).toUpperCase() + req.status.slice(1);
            let color = '#B24E00';
            let bg = '#FFFAEB';

            if (req.status === 'approved') {
                color = '#027A48';
                bg = '#ECFDF3';
            } else if (req.status === 'rejected') {
                color = '#B42318';
                bg = '#FEE4E2';
            }

            return {
                id: req._id.toString(),
                type: req.leaveTypeName || req.leaveType,
                code: `LR-2026-${req._id.toString().substring(req._id.toString().length - 4).toUpperCase()}`,
                dates: req.fromDate === req.toDate ? req.fromDate : `${req.fromDate} – ${req.toDate}`,
                totalDays: req.totalDays,
                appliedOn: new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                reason: req.reason || '—',
                status: statusCapitalized,
                color: color,
                bg: bg,
                subTime: new Date(req.createdAt).toISOString().replace('T', ' ').substring(0, 16),
            };
        });

        return Response.json({
            success: true,
            requests: formattedRequests
        });

    } catch (error) {
        console.error('Fetch Leave Requests Error:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}