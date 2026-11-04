import connectDB from '../../../lib/db';
import Employee from '../../../models/Employee';
import crypto from 'crypto';

export async function POST(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { employeeId, currentPassword, newPassword } = body;

        if (!employeeId || !currentPassword || !newPassword) {
            return Response.json({ success: false, message: 'All password fields are required.' }, { status: 400 });
        }

        // Find employee by ID
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return Response.json({ success: false, message: 'Employee not found.' }, { status: 404 });
        }

        // Verify current password using model method
        const isMatch = employee.comparePassword(currentPassword);
        if (!isMatch) {
            return Response.json({ success: false, message: 'Current password is incorrect.' }, { status: 400 });
        }

        // Validate password complexity server-side
        const satisfiesLength = newPassword.length >= 8;
        const satisfiesUppercase = /[A-Z]/.test(newPassword);
        const satisfiesNumber = /[0-9]/.test(newPassword);
        const satisfiesSymbol = /[^A-Za-z0-9]/.test(newPassword);

        if (!satisfiesLength || !satisfiesUppercase || !satisfiesNumber || !satisfiesSymbol) {
            return Response.json({ success: false, message: 'New password does not meet complexity requirements.' }, { status: 400 });
        }

        // Hash and update password
        employee.password = employee.hashPassword(newPassword);
        await employee.save();

        return Response.json({
            success: true,
            message: 'Password changed successfully!'
        });

    } catch (error) {
        console.error('Update Password Error:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}