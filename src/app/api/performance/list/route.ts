import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Performance from '@/models/Performance';

export async function GET(request: Request) {
    try {
        const session = await getUserFromRequest(request);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const internId = searchParams.get('internId');

        await connectToDatabase();

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const query: any = {};
        if (internId) {
            query.intern = internId;
        }

        const [performances, total] = await Promise.all([
            Performance.find(query)
                .select('intern reviewer period overallScore metrics feedback goals createdAt')
                .populate({ path: 'intern', select: 'name email department' })
                .populate({ path: 'reviewer', select: 'name email role' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Performance.countDocuments(query)
        ]);

        return NextResponse.json({
            performances,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('List Performance Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
