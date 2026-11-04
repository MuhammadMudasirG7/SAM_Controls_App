    import mongoose from 'mongoose';

    const leaveRequestSchema = new mongoose.Schema({
        employeeId: {
            type: String,
            required: true,
            index: true,
        },
        leaveType: {
            type: String, // 'annual', 'sick', 'emergency', 'hajj'
            required: true,
        },
        leaveTypeName: {
            type: String,
            required: true,
        },
        fromDate: {
            type: String, // 'YYYY-MM-DD'
            required: true,
        },
        toDate: {
            type: String, // 'YYYY-MM-DD'
            required: true,
        },
        isHalfDay: {
            type: Boolean,
            default: false,
        },
        totalDays: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            default: '',
        },
        attachedFile: {
            name: { type: String, default: null },
            size: { type: String, default: null },
            fileUrl: { type: String, default: null },
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    }, {
        timestamps: true,
    });

    export default mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveRequestSchema);