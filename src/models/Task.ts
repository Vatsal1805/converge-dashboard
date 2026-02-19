import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description?: string;
    projectId: mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId; // User (Intern)
    priority: 'low' | 'medium' | 'high';
    status: 'todo' | 'in_progress' | 'review' | 'completed' | 'rejected';
    internStatus?: 'not_started' | 'started' | 'issue' | 'emergency' | 'other';
    internNote?: string;
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
        enum: ['todo', 'in_progress', 'review', 'completed', 'rejected'],
        default: 'todo'
    },
    internStatus: {
        type: String,
        enum: ['not_started', 'started', 'issue', 'emergency', 'other'],
        default: 'not_started'
    },
    internNote: { type: String },
    deadline: { type: Date, required: true },
    estimatedHours: { type: Number, default: 0 },
    hoursLogged: { type: Number, default: 0 },
    reviewNote: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
});

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
