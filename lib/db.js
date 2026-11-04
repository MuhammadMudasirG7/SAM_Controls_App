
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const cached = globalThis.__mongooseCache || (globalThis.__mongooseCache = {
    conn: null,
    promise: null,
});

export default async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is missing from environment variables.');
    }

    const connection = mongoose.connection;

    // Already connected: existing connection reuse karo
    if (connection.readyState === 1) {
        cached.conn = connection;
        return connection;
    }

    // Connection already in progress: usi promise ka wait karo
    if (connection.readyState === 2 && cached.promise) {
        await cached.promise;
        return connection;
    }

    // Disconnected ya stale connection: old cache clear karo
    if (connection.readyState === 0) {
        cached.conn = null;
        cached.promise = null;
    }

    // Naya connection sirf jab zaroori ho
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        }).then(() => {
            console.log('MongoDB connected. State:', mongoose.connection.readyState);
            return mongoose.connection;
        }).catch((error) => {
            cached.conn = null;
            cached.promise = null;
            console.error('MongoDB connection failed:', error.message);
            throw error;
        });
    }

    cached.conn = await cached.promise;

    if (mongoose.connection.readyState !== 1) {
        cached.conn = null;
        cached.promise = null;
        throw new Error('MongoDB connection is not ready.');
    }

    return cached.conn;
}
