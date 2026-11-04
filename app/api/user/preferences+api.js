import dbConnect from '../../../lib/db';
import UserPreferences from '../../../models/UserPreferences';

// 🔄 GET: Load User Profile & Settings
export async function GET(request) {
    try {
        await dbConnect();
        const url = new URL(request.url);
        const employeeId = url.searchParams.get('employeeId');

        if (!employeeId) {
            return Response.json({ success: false, message: 'Employee ID required' }, { status: 400 });
        }

        let user = await UserPreferences.findOne({ employeeId }).lean();

        // Fallback default setting if new user
        if (!user) {
            user = {
                employeeId,
                isFingerprintEnabled: true,
                isHourlyEnabled: true,
                language: 'English',
                locationConsentAccepted: true,
                workSite: 'Multan Gulshan Town - Asia/Karachi (UTC+5)'
            };
        }

        return Response.json({ success: true, preferences: user });

    } catch (error) {
        return Response.json({ success: false, message: error.message }, { status: 500 });
    }
}

// 🔄 POST: Toggle Fingerprint or Hourly Settings
export async function POST(request) {
    try {
        await dbConnect();
        const { employeeId, setting, enabled } = await request.json();

        if (!employeeId) {
            return Response.json({ success: false, message: 'Employee ID required' }, { status: 400 });
        }

        let updateData = {};
        if (setting === 'fingerprint') updateData.isFingerprintEnabled = enabled;
        if (setting === 'hourly') updateData.isHourlyEnabled = enabled;

        const updatedUser = await UserPreferences.findOneAndUpdate(
            { employeeId },
            { $set: updateData },
            { upsert: true, new: true }
        );

        return Response.json({
            success: true,
            message: 'Setting updated successfully',
            preferences: updatedUser
        });

    } catch (error) {
        return Response.json({ success: false, message: error.message }, { status: 500 });
    }
}