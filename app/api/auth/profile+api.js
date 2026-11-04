import connectDB from '../../../lib/db';
import Employee from '../../../models/Employee';

// GET: Fetch Employee Profile details & work site info
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        if (!employeeId) {
            return Response.json({ success: false, message: 'Employee ID is required.' }, { status: 400 });
        }

        const employee = await Employee.findOne({ employeeId }).select('-password').lean();
        if (!employee) {
            return Response.json({ success: false, message: 'Employee not found.' }, { status: 404 });
        }

        return Response.json({
            success: true,
            profile: {
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                role: employee.role || 'Site Engineer - Operations',
                workSite: employee.workSite || 'Al Olaya Operations Centre - Asia/Riyadh (UTC+3)',
                consentVersion: employee.consentVersion || 'v1.0',
                consentDate: employee.consentDate || '22 Sep 2026 07:52',
            }
        });

    } catch (error) {
        console.error('Fetch Profile Error:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}

// PATCH: Update user preferences (Language, Fingerprint, Hourly presence consent)
export async function PATCH(request) {
    try {
        await connectDB();
        const body = await request.json();
        const { employeeId, preferences, withdrawConsent } = body;

        if (!employeeId) {
            return Response.json({ success: false, message: 'Employee ID is required.' }, { status: 400 });
        }

        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return Response.json({ success: false, message: 'Employee not found.' }, { status: 404 });
        }

        if (withdrawConsent) {
            employee.consentWithdrawn = true;
            employee.consentDate = null;
        }

        if (preferences) {
            if (preferences.language) employee.language = preferences.language;
            if (preferences.isFingerprintEnabled !== undefined) employee.isFingerprintEnabled = preferences.isFingerprintEnabled;
            if (preferences.isHourlyEnabled !== undefined) employee.isHourlyEnabled = preferences.isHourlyEnabled;
        }

        await employee.save();

        return Response.json({
            success: true,
            message: 'Preferences updated successfully.',
            data: employee
        });

    } catch (error) {
        console.error('Update Preferences Error:', error);
        return Response.json({ success: false, message: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}