import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    boundaryRadius: { type: Number, default: 500 }, // Meters (e.g. 200m, 350m)
    hourlyPresenceAllowed: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);