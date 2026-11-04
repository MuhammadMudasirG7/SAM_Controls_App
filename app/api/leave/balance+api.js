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

        const balances = {
            annual: { total: 21, taken: 0, pending: 0, remaining: 21 },
            sick: { total: 30, taken: 0, pending: 0, remaining: 30 },
            emergency: { total: 5, taken: 0, pending: 0, remaining: 5 },
            hajj: { total: 10, taken: 0, pending: 0, remaining: 10 },
        };

        requests.forEach(req => {
            const type = req.leaveType;
            if (balances[type]) {
                if (req.status === 'approved') {
                    balances[type].taken += req.totalDays;
                } else if (req.status === 'pending') {
                    balances[type].pending += req.totalDays;
                }
            }
        });

        Object.keys(balances).keys && Object.keys(balances).forEach(type => {
            balances[type].remaining = Math.max(0, balances[type].total - (balances[type].taken + balances[type].pending));
        });

        return Response.json({
            success: true,
            hasEntitlement: true,
            balances,
            requestsHistory: requests,
        });

    } catch (error) {
        console.error('Leave Balance API Error:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}