import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Lead from '@/models/Lead';
import { cookies } from 'next/headers';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session || ((session as any).role !== 'founder' && (session as any).role !== 'teamlead')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        await connectToDatabase();

        const lead = await Lead.findByIdAndUpdate(params.id, body, { new: true });

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({ lead });

    } catch (error) {
        console.error('Update Lead Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
