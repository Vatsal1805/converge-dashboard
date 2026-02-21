import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Project from '@/models/Project';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        let query = {};
        const role = (session as any).role;
        const userId = (session as any).id;

        if (role === 'teamlead') {
            query = { teamLeadId: userId };
        } else if (role === 'intern') {
            query = { _id: { $exists: false } };
        }

        const [projects, total] = await Promise.all([
            Project.find(query)
                .populate('teamLeadId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Project.countDocuments(query)
        ]);

        return NextResponse.json({
            projects,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('List Projects Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
