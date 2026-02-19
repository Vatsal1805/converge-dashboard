import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Performance from '@/models/Performance';
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

        const { searchParams } = new URL(request.url);
        const internId = searchParams.get('internId');

        await connectToDatabase();

        const query: any = {};
        if (internId) {
            query.intern = internId;
        }

        const performances = await Performance.find(query)
            .populate('intern', 'name email department')
            .populate('reviewer', 'name email role')
            .sort({ createdAt: -1 });

        return NextResponse.json({ performances });
    } catch (error) {
        console.error('List Performance Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
