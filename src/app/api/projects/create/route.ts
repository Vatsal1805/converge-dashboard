import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { z } from 'zod';
import { cookies } from 'next/headers';

const createProjectSchema = z.object({
    name: z.string().min(2),
    clientName: z.string().min(2),
    description: z.string().optional(),
    teamLeadId: z.string(),
    deadline: z.string().transform(str => new Date(str)),
    priority: z.enum(['low', 'medium', 'high']),
    budget: z.number().nonnegative().optional(),
});

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session || (session as any).role !== 'founder') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const data = createProjectSchema.parse(body);

        await connectToDatabase();

        // Verify Team Lead exists
        const teamLead = await User.findById(data.teamLeadId);
        if (!teamLead || teamLead.role !== 'teamlead') {
            return NextResponse.json({ error: 'Invalid Team Lead ID' }, { status: 400 });
        }

        const project = await Project.create({
            ...data,
            createdBy: (session as any).id
        });

        return NextResponse.json({ project }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Create Project Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
