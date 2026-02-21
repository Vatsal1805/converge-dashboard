import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrainstorm extends Document {
    author: mongoose.Types.ObjectId;
    content: string;
    tags: string[];
    likes: mongoose.Types.ObjectId[];
    comments: {
        author: mongoose.Types.ObjectId;
        content: string;
        createdAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const BrainstormSchema = new Schema<IBrainstorm>(
    {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        tags: [{ type: String }],
        likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        comments: [{
            author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
    },
    { timestamps: true }
);

// Indexes for performance
BrainstormSchema.index({ author: 1 });
BrainstormSchema.index({ createdAt: -1 });
BrainstormSchema.index({ tags: 1 });

const Brainstorm: Model<IBrainstorm> = mongoose.models.Brainstorm || mongoose.model<IBrainstorm>('Brainstorm', BrainstormSchema);
export default Brainstorm;
