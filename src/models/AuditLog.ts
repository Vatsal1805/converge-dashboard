import mongoose, { Schema, Model, Document } from "mongoose";

/**
 * Audit Log Model
 * Tracks all important actions in the system for accountability
 */

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: "founder" | "teamlead" | "intern";
  action: string;
  entityType:
    | "user"
    | "project"
    | "task"
    | "lead"
    | "performance"
    | "research"
    | "brainstorm";
  entityId: mongoose.Types.ObjectId;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userRole: {
      type: String,
      enum: ["founder", "teamlead", "intern"],
      required: true,
    },
    action: { type: String, required: true }, // e.g., 'created', 'updated', 'deleted', 'status_changed'
    entityType: {
      type: String,
      enum: [
        "user",
        "project",
        "task",
        "lead",
        "performance",
        "research",
        "brainstorm",
      ],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    changes: { type: Schema.Types.Mixed }, // Before/after values
    metadata: { type: Schema.Types.Mixed }, // Additional context
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false, // We use our own timestamp field
  },
);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
