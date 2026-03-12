import mongoose, { Schema, Model, Document } from "mongoose";

export interface IProjectDocument {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
}

export interface IProject extends Document {
  name: string;
  clientName: string;
  description?: string;
  teamLeadIds: mongoose.Types.ObjectId[]; // Multiple team leads
  members: mongoose.Types.ObjectId[]; // Interns assigned to this project
  deadline: Date;
  status: "planning" | "active" | "completed" | "on_hold";
  priority: "low" | "medium" | "high";
  budget?: number;
  projectDocument?: IProjectDocument; // Project report/document
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    clientName: { type: String, required: true },
    description: { type: String },
    teamLeadIds: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "on_hold"],
      default: "planning",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    budget: { type: Number },
    projectDocument: {
      filename: { type: String },
      originalName: { type: String },
      size: { type: Number },
      mimeType: { type: String },
      url: { type: String },
      uploadedAt: { type: Date },
      uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  },
);

// Indexes for performance
ProjectSchema.index({ teamLeadIds: 1 });
ProjectSchema.index({ members: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ createdAt: -1 }); // Optimized for latest project sorting

// Backward compatibility: Handle old teamLeadId field during queries
ProjectSchema.pre(["find", "findOne"], function () {
  // This middleware ensures old documents with teamLeadId still work
  // During the transition period before migration is complete
});

// Post-query middleware to handle backward compatibility
ProjectSchema.post(["find", "findOne"], function (docs: any) {
  if (!docs) return;

  const documents = Array.isArray(docs) ? docs : [docs];

  documents.forEach((doc: any) => {
    // If document has old teamLeadId field, convert it to teamLeadIds array
    if (doc && doc.teamLeadId && !doc.teamLeadIds) {
      doc.teamLeadIds = [doc.teamLeadId];
      delete doc.teamLeadId;
    }
  });
});

// Clear cached model in development to ensure schema updates are applied
if (process.env.NODE_ENV !== "production" && mongoose.models.Project) {
  delete mongoose.models.Project;
}

const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
