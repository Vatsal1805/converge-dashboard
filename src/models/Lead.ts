import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ILead extends Document {
    name: string;
    company: string;
    email: string;
    phone?: string;
    source: string;
    dealValue: number;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
    assignedTo?: mongoose.Types.ObjectId; // Team Lead
    dateAdded: Date;
    lastContact?: Date;
    followUpDate?: Date;
    createdBy: mongoose.Types.ObjectId;
}

const LeadSchema = new Schema<ILead>({
    name: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    source: { type: String, default: 'Website' },
    dealValue: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
        default: 'new'
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    dateAdded: { type: Date, default: Date.now },
    lastContact: { type: Date },
    followUpDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true,
});

// Indexes for performance
LeadSchema.index({ assignedTo: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ dateAdded: -1 });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
