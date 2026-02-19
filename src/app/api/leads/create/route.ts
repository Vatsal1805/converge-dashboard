import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Lead from '@/models/Lead';
import { z } from 'zod';
import { cookies } from 'next/headers';

const createLeadSchema = z.object({
    name: z.string().min(2),
    company: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    dealValue: z.number().nonnegative(),
    status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']).optional(),
});

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session || ((session as any).role !== 'founder' && (session as any).role !== 'teamlead')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const data = createLeadSchema.parse(body);

        await connectToDatabase();

        const lead = await Lead.create({
            ...data,
            createdBy: (session as any).id,
            assignedTo: (session as any).role === 'teamlead' ? (session as any).id : undefined
        });

        return NextResponse.json({ lead }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Create Lead Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
