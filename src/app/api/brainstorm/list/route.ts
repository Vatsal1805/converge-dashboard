import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Brainstorm from '@/models/Brainstorm';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function GET() {
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

        const posts = await Brainstorm.find({})
            .populate('author', 'name email role')
            .populate('likes', 'name')
            .populate('comments.author', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('List Brainstorm Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
