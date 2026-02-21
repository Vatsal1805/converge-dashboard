import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
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

        if (role === 'intern') {
            query = { assignedTo: userId };
        } else if (role === 'teamlead') {
            // Team Lead filter logic (placeholder or as implemented before)
        }

        const [tasks, total] = await Promise.all([
            Task.find(query)
                .populate('projectId', 'name clientName')
                .populate('assignedTo', 'name email')
                .sort({ deadline: 1 })
                .skip(skip)
                .limit(limit),
            Task.countDocuments(query)
        ]);

        return NextResponse.json({
            tasks,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('List Tasks Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
