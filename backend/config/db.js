/**
 * ============================================================================
 * MONGO DB DATABASE CONNECTION HELPER (OPTIONAL)
 * ============================================================================
 * Description: Connects to MongoDB database using Mongoose if configured.
 * ============================================================================
 */

const mongoose = require("mongoose");

/**
 * Connects to MongoDB database using MONGO_URI environment variable.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is missing from your .env file.");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

