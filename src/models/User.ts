import mongoose, { Schema, Model, Document } from "mongoose";

export type UserRole = "founder" | "teamlead" | "intern";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  status: "active" | "inactive";
  performanceScore: number;
  phone?: string;
  linkedin?: string;
  github?: string;
  timezone?: string;
  profileCompleted: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["founder", "teamlead", "intern"],
      default: "intern",
      required: true,
    },
    department: { type: String, default: "General" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    performanceScore: { type: Number, default: 0 },
    phone: { type: String },
    linkedin: { type: String },
    github: { type: String },
    timezone: { type: String, default: "UTC" },
    profileCompleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  },
);

// Prevent model overwrite in hot reload
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
