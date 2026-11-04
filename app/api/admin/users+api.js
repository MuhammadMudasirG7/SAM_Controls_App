import dbConnect from '../../../lib/db';
import Employee from '../../../models/Employee';

export async function GET(request) {
    try {
        await dbConnect();
        const users = await Employee.find({}).sort({ createdAt: -1 }).lean();
        
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            employeeId: user.employeeId || 'N/A',
            name: user.name || 'Unnamed',
            email: user.email || '',
            role: user.role || 'employee',
            isBlocked: !!user.isBlocked,
            createdAt: user.createdAt
        }));

        return Response.json({ success: true, users: formattedUsers });
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        await dbConnect();
        const { userId, isBlocked } = await request.json();

        if (!userId) {
            return Response.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        const updatedUser = await Employee.findByIdAndUpdate(
            userId,
            { isBlocked: isBlocked },
            { new: true }
        );

        if (!updatedUser) {
            return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return Response.json({ success: true, user: updatedUser });
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}