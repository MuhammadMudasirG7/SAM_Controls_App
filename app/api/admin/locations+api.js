import dbConnect from '../../../lib/db';
import Location from '../../../models/Location';

export async function GET() {
    try {
        await dbConnect();
        const locations = await Location.find({}).sort({ createdAt: -1 }).lean();
        return Response.json({ success: true, locations });
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { name, code, city, latitude, longitude, boundaryRadius, hourlyPresenceAllowed } = body;

        if (!name || latitude === undefined || longitude === undefined) {
            return Response.json({ success: false, error: 'Name, Latitude and Longitude are required' }, { status: 400 });
        }

        const newLocation = new Location({
            name,
            code: code || `LOC-${Math.floor(100 + Math.random() * 900)}`,
            city: city || 'Multan',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            boundaryRadius: parseInt(boundaryRadius, 10) || 500,
            hourlyPresenceAllowed: hourlyPresenceAllowed !== undefined ? hourlyPresenceAllowed : true
        });

        await newLocation.save();
        return Response.json({ success: true, location: newLocation });
    } catch (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}