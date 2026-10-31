const mongoose = require('mongoose');

let memoryServer = null;

async function connectDB() {
  const uri = process.env.MONGO_URI;
  console.log("MONGO_URI loaded:", !!uri);
  console.log("MongoDB URL type:", uri ? uri.split(":")[0] : "NOT FOUND");
  console.log("Using Atlas:", uri?.startsWith("mongodb+srv://"));

  // Try configured URI first if provided
  if (uri && !uri.includes('<username>')) {
    try {
      console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/[^@]+@/, '//***:***@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected successfully via MONGO_URI.');
      return;
    } catch (err) {
      console.warn(`Primary MongoDB connection failed (${err.message}). Checking in-memory fallback...`);
    }
  }

  // Graceful fallback to MongoMemoryServer for development / instant testing
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Starting in-memory MongoDB server for development...');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'smart-study-lamp',
      },
    });
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    console.log(`In-memory MongoDB started and connected: ${memUri}`);
  } catch (memErr) {
    console.error('Fatal: Could not connect to MongoDB or in-memory instance:', memErr.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

module.exports = { connectDB, disconnectDB };
