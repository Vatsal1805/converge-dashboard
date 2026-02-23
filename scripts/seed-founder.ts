// Script to seed a founder user
// Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-founder.ts
// Or: npx tsx scripts/seed-founder.ts

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["founder", "teamlead", "intern"],
      default: "intern",
    },
    department: { type: String, default: "General" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    performanceScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seedFounder() {
  try {
    console.log("Connecting to MongoDB:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB");

    // Check if founder exists
    const existingFounder = await User.findOne({ role: "founder" });

    if (existingFounder) {
      console.log("Founder already exists:", existingFounder.email);
      console.log("Updating password...");

      const hashedPassword = await bcrypt.hash("founder123", 10);
      existingFounder.password = hashedPassword;
      await existingFounder.save();

      console.log("Password updated to: founder123");
    } else {
      const hashedPassword = await bcrypt.hash("founder123", 10);

      const founder = await User.create({
        name: "Founder Admin",
        email: "founder@convergedigitals.com",
        password: hashedPassword,
        role: "founder",
        department: "Executive",
        status: "active",
      });

      console.log("Founder created:", founder.email);
    }

    console.log("\n=== Login Credentials ===");
    console.log("Email: founder@convergedigitals.com");
    console.log("Password: founder123");
    console.log("=========================\n");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedFounder();
