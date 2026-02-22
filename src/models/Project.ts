import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IProject extends Document {
    name: string;
    clientName: string;
    description?: string;
    teamLeadId: mongoose.Types.ObjectId; // User with role 'teamlead'
    deadline: Date;
    status: 'planning' | 'active' | 'completed' | 'on_hold';
    priority: 'low' | 'medium' | 'high';
    budget?: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
    name: { type: String, required: true },
    clientName: { type: String, required: true },
    description: { type: String },
    teamLeadId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deadline: { type: Date, required: true },
    status: {
        type: String,
        enum: ['planning', 'active', 'completed', 'on_hold'],
        default: 'planning'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    budget: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
});

// Indexes for performance
ProjectSchema.index({ teamLeadId: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ createdAt: -1 }); // Optimized for latest project sorting

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
