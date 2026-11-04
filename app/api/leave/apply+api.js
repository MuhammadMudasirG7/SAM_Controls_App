import connectDB from '../../../lib/db';
import LeaveRequest from '../../../models/LeaveRequest';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();

        const {
            employeeId,
            leaveType,
            leaveTypeName,
            fromDate,
            toDate,
            isHalfDay,
            totalDays,
            reason,
            attachedFile
        } = body;

        if (!employeeId || !leaveType || !fromDate || !toDate) {
            return Response.json({ 
                success: false, 
                message: 'Missing required fields: employeeId, leaveType, fromDate, and toDate are required.' 
            }, { status: 400 });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return Response.json({ success: false, message: 'Invalid date formats provided.' }, { status: 400 });
        }

        const calculatedDays = isHalfDay ? 0.5 : Math.max(1, totalDays || Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);

        const newLeaveRequest = await LeaveRequest.create({
            employeeId,
            leaveType,
            leaveTypeName: leaveTypeName || leaveType,
            fromDate,
            toDate,
            isHalfDay: !!isHalfDay,
            totalDays: calculatedDays,
            reason: reason || '',
            attachedFile: attachedFile ? {
                name: attachedFile.name || null,
                size: attachedFile.size || null,
                fileUrl: attachedFile.uri || null,
            } : null,
            status: 'pending',
        });

        return Response.json({
            success: true,
            message: 'Leave request submitted successfully!',
            data: newLeaveRequest,
        });

    } catch (error) {
        console.error('Apply Leave API Error:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}