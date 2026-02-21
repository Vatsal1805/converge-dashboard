import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Brainstorm from '@/models/Brainstorm';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const session = await verifyToken(token);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url || ''); // brainstorm/list might be called without URL object in internal mocks? request.url should be there.
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            Brainstorm.find({})
                .populate('author', 'name email role')
                .populate('likes', 'name')
                .populate('comments.author', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Brainstorm.countDocuments({})
        ]);

        return NextResponse.json({
            posts,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('List Brainstorm Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
