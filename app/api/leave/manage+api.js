import connectDB from '../../../lib/db';
import LeaveRequest from '../../../models/LeaveRequest';

export async function PATCH(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { requestId, action, managerComment } = body; // action: 'approve' or 'reject'

        if (!requestId || !action) {
            return Response.json({ success: false, message: 'Request ID and action are required.' }, { status: 400 });
        }

        const leaveReq = await LeaveRequest.findById(requestId);
        if (!leaveReq) {
            return Response.json({ success: false, message: 'Leave request not found.' }, { status: 404 });
        }

        if (leaveReq.status !== 'pending') {
            return Response.json({ success: false, message: 'This request has already been processed.' }, { status: 400 });
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        leaveReq.status = newStatus;
        
        if (managerComment) {
            leaveReq.reason = leaveReq.reason + ` | Manager Note: ${managerComment}`;
        }

        await leaveReq.save();

        return Response.json({
            success: true,
            message: `Leave request ${newStatus} successfully!`,
            data: leaveReq
        });

    } catch (error) {
        console.error('Manage Leave Error:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}