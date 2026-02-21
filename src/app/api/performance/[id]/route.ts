import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import connectToDatabase from '@/lib/db';
import Performance from '@/models/Performance';
import User from '@/models/User';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectToDatabase();
        const performance = await Performance.findById(id).populate('intern reviewer');

        if (!performance) {
            return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
        }

        return NextResponse.json({ performance });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session as any).role;
        if (role !== 'founder' && role !== 'teamlead') {
            return NextResponse.json({ error: 'Forbidden: Only founders and team leads can edit reviews' }, { status: 403 });
        }

        await connectToDatabase();

        // Calculate new overall score if metrics changed
        if (body.metrics) {
            const m = body.metrics;
            body.overallScore = Math.round(((m.taskCompletion + m.quality + m.communication + m.punctuality + m.initiative) / 5) * 10);
        }

        const performance = await Performance.findByIdAndUpdate(id, body, { new: true });

        if (!performance) {
            return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
        }

        // Update user's aggregate performance score
        const allReviews = await Performance.find({ intern: performance.intern });
        const avgScore = Math.round(allReviews.reduce((sum, r) => sum + r.overallScore, 0) / allReviews.length);
        await User.findByIdAndUpdate(performance.intern, { performanceScore: avgScore });

        return NextResponse.json({ performance });
    } catch (error) {
        console.error('Update Performance Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session as any).role;
        if (role !== 'founder') {
            return NextResponse.json({ error: 'Forbidden: Only founders can delete reviews' }, { status: 403 });
        }

        await connectToDatabase();
        const performance = await Performance.findByIdAndDelete(id);

        if (!performance) {
            return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
        }

        // Update user's aggregate performance score after deletion
        const allReviews = await Performance.find({ intern: performance.intern });
        const avgScore = allReviews.length > 0
            ? Math.round(allReviews.reduce((sum, r) => sum + r.overallScore, 0) / allReviews.length)
            : 0;
        await User.findByIdAndUpdate(performance.intern, { performanceScore: avgScore });

        return NextResponse.json({ message: 'Performance review deleted successfully' });
    } catch (error) {
        console.error('Delete Performance Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
