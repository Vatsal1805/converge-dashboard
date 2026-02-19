import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ user: null });
    }

    const payload = await verifyToken(token);

    if (!payload) {
        return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: payload });
}
