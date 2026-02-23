import mongoose, { Schema, Model, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "task" | "project" | "lead" | "brainstorm" | "performance" | "team";
  priority: "critical" | "important" | "info";
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["task", "project", "lead", "brainstorm", "performance", "team"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["critical", "important", "info"],
      default: "info",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    actionUrl: {
      type: String,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
    relatedModel: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient querying
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Clear cached model in development
if (process.env.NODE_ENV !== "production" && mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
