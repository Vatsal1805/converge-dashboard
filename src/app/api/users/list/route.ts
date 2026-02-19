import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
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
        const role = (session as any)?.role;

        if (!session || (role !== 'founder' && role !== 'teamlead')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();

        // Support filtering by role via query params
        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get('role');
        
        const query: any = {};
        if (roleFilter) {
            // Support comma-separated roles like "intern,teamlead"
            const roles = roleFilter.split(',').map(r => r.trim());
            query.role = { $in: roles };
        }

        const users = await User.find(query)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 });

        return NextResponse.json({ users });

    } catch (error) {
        console.error('List Users Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
