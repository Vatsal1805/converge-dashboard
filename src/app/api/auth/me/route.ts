import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
    const payload = await getUserFromRequest(request);

    if (!payload) {
        return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: payload });
}
