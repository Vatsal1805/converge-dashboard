import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResearch extends Document {
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    content?: string; // Extracted text content from document
    projectId?: mongoose.Types.ObjectId;
    submittedBy: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    reviewedBy?: mongoose.Types.ObjectId;
    reviewNotes?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ResearchSchema = new Schema<IResearch>(
    {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true },
        content: { type: String },
        projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
        submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewNotes: { type: String },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

const Research: Model<IResearch> = mongoose.models.Research || mongoose.model<IResearch>('Research', ResearchSchema);
export default Research;
