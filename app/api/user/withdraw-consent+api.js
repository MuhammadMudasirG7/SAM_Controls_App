import dbConnect from '../../../lib/db';
import UserPreferences from '../../../models/UserPreferences';

export async function POST(request) {
    try {
        await dbConnect();
        const { employeeId } = await request.json();

        if (!employeeId) {
            return Response.json({ success: false, message: 'Employee ID required' }, { status: 400 });
        }

        await UserPreferences.findOneAndUpdate(
            { employeeId },
            { $set: { locationConsentAccepted: false } },
            { upsert: true }
        );

        return Response.json({
            success: true,
            message: 'Location consent withdrawn successfully'
        });

    } catch (error) {
        return Response.json({ success: false, message: error.message }, { status: 500 });
    }
}