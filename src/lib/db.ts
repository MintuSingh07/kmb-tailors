import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kmb-tailor';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during hot reloads.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Connecting to MongoDB at:', MONGODB_URI);
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      console.log('Successfully connected to MongoDB.');
      try {
        if (mongooseInstance.connection.db) {
          await mongooseInstance.connection.db.collection('clients').dropIndex('clientNo_1');
          console.log('Successfully dropped unique index on clientNo.');
        }
      } catch (err) {
        // Ignore errors if index doesn't exist
      }
      return mongooseInstance;
    }).catch((err) => {
      console.error('Failed to connect to MongoDB:', err.message);
      cached.promise = null; // Reset promise so we can retry
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
