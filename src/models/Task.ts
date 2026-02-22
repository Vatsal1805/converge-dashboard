import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    projectId: mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId; // User (Intern)
    priority: 'low' | 'medium' | 'high';
    status: 'not_started' | 'in_progress' | 'working' | 'on_hold' | 'under_review' | 'completed';
    internStatus?: 'not_started' | 'started' | 'issue' | 'emergency' | 'other';
    internNote?: string;
    attachments: {
        name: string;
        url: string;
        type: string;
        uploadedAt: Date;
    }[];
    deadline: Date;
    estimatedHours: number;
    hoursLogged: number;
    reviewNote?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const TaskSchema = new Schema<ITask>({
    title: { type: String, required: true },
    description: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['not_started', 'in_progress', 'working', 'on_hold', 'under_review', 'completed'],
        default: 'not_started'
    },
    internStatus: {
        type: String,
        enum: ['not_started', 'started', 'issue', 'emergency', 'other'],
        default: 'not_started'
    },
    internNote: { type: String },
    attachments: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    deadline: { type: Date, required: true },
    estimatedHours: { type: Number, default: 0 },
    hoursLogged: { type: Number, default: 0 },
    reviewNote: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
});

// Indexes for performance optimization
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, deadline: 1 }); // Optimized for "My Tasks" page
TaskSchema.index({ status: 1, deadline: 1 });    // Optimized for filtering by status
TaskSchema.index({ deadline: 1 });
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ createdBy: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
