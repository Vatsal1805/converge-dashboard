import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Performance from '@/models/Performance';
import User from '@/models/User';
import { z } from 'zod';
import { cookies } from 'next/headers';

const createPerformanceSchema = z.object({
    intern: z.string(),
    period: z.string(),
    metrics: z.object({
        taskCompletion: z.number().min(1).max(10),
        quality: z.number().min(1).max(10),
        communication: z.number().min(1).max(10),
        punctuality: z.number().min(1).max(10),
        initiative: z.number().min(1).max(10),
    }),
    feedback: z.string().optional(),
    goals: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await verifyToken(token);
        const role = (session as any)?.role;

        if (!session || (role !== 'founder' && role !== 'teamlead')) {
            return NextResponse.json({ error: 'Forbidden: Only Founder or Team Lead can give reviews' }, { status: 403 });
        }

        const body = await request.json();
        const data = createPerformanceSchema.parse(body);

        await connectToDatabase();

        // Verify intern exists
        const intern = await User.findById(data.intern);
        if (!intern || intern.role !== 'intern') {
            return NextResponse.json({ error: 'Invalid intern ID' }, { status: 400 });
        }

        // Check if review already exists for this period
        const existing = await Performance.findOne({
            intern: data.intern,
            period: data.period,
        });

        if (existing) {
            return NextResponse.json({ error: 'Performance review already exists for this period' }, { status: 409 });
        }

        const performance = await Performance.create({
            ...data,
            reviewer: (session as any).id,
        });

        // Update user's performance score
        const allPerformances = await Performance.find({ intern: data.intern });
        const avgScore = Math.round(
            allPerformances.reduce((sum, p) => sum + p.overallScore, 0) / allPerformances.length
        );
        await User.findByIdAndUpdate(data.intern, { performanceScore: avgScore });

        const populated = await Performance.findById(performance._id)
            .populate('intern', 'name email department')
            .populate('reviewer', 'name email role');

        return NextResponse.json({ performance: populated }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Create Performance Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
