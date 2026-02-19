import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPerformance extends Document {
    intern: mongoose.Types.ObjectId;
    reviewer: mongoose.Types.ObjectId;
    period: string; // e.g., "2026-02" for Feb 2026
    metrics: {
        taskCompletion: number; // 1-10
        quality: number; // 1-10
        communication: number; // 1-10
        punctuality: number; // 1-10
        initiative: number; // 1-10
    };
    overallScore: number;
    feedback: string;
    goals: string;
    createdAt: Date;
    updatedAt: Date;
}

const PerformanceSchema = new Schema<IPerformance>(
    {
        intern: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        period: { type: String, required: true },
        metrics: {
            taskCompletion: { type: Number, min: 1, max: 10, required: true },
            quality: { type: Number, min: 1, max: 10, required: true },
            communication: { type: Number, min: 1, max: 10, required: true },
            punctuality: { type: Number, min: 1, max: 10, required: true },
            initiative: { type: Number, min: 1, max: 10, required: true },
        },
        overallScore: { type: Number, min: 0, max: 100 },
        feedback: { type: String, default: '' },
        goals: { type: String, default: '' },
    },
    { timestamps: true }
);

// Calculate overall score before saving
PerformanceSchema.pre('save', function() {
    const metrics = this.metrics;
    this.overallScore = Math.round(
        ((metrics.taskCompletion + metrics.quality + metrics.communication + 
          metrics.punctuality + metrics.initiative) / 5) * 10
    );
});

const Performance: Model<IPerformance> = mongoose.models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);
export default Performance;
