import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
    name: string;
    description?: string;
    teamLeadId: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[]; // Array of intern user IDs
    department: string;
    status: 'active' | 'inactive';
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    teamLeadId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    department: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true
});

// Indexes for faster queries
TeamSchema.index({ teamLeadId: 1 });
TeamSchema.index({ members: 1 });
TeamSchema.index({ department: 1 });
TeamSchema.index({ status: 1 });

const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
