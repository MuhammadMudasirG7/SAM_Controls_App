import dbConnect from '../../../lib/db';
import LeaveRequest from '../../../models/LeaveRequest';

// GET: تمام لیو ریکویسٹس لانے کے لیے (ایڈمن پورٹل اور نوٹیفیکیشنز کے لیے)
export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        let query = {};
        if (employeeId) {
            query.employeeId = employeeId;
        }

        const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });
        return Response.json({ success: true, leaves });
    } catch (error) {
        console.error('Fetch Admin Leaves Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH: ایڈمن کی طرف سے لیو اپروو یا ریجیکٹ کرنے کے لیے
export async function PATCH(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { leaveId, status } = body; // status: 'approved' ya 'rejected'

        if (!leaveId || !status) {
            return Response.json({ success: false, error: 'Leave ID and status are required.' }, { status: 400 });
        }

        const updatedLeave = await LeaveRequest.findByIdAndUpdate(
            leaveId,
            { $set: { status: status.toLowerCase() } },
            { new: true }
        );

        if (!updatedLeave) {
            return Response.json({ success: false, error: 'Leave request not found.' }, { status: 404 });
        }

        return Response.json({ 
            success: true, 
            message: `Leave request has been ${status.toLowerCase()} successfully.`,
            leave: updatedLeave 
        });
    } catch (error) {
        console.error('Update Leave Status Error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}