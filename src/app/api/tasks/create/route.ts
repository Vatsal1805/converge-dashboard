import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import Project from '@/models/Project';
import User from '@/models/User';
import { z } from 'zod';
import { cookies } from 'next/headers';

const createTaskSchema = z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    projectId: z.string(),
    assignedTo: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    deadline: z.string().transform(str => new Date(str)),
    estimatedHours: z.number().nonnegative(),
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
        const data = createTaskSchema.parse(body);

        await connectToDatabase();

        // Verify Project exists
        const project = await Project.findById(data.projectId);
        if (!project) {
            return NextResponse.json({ error: 'Invalid Project ID' }, { status: 400 });
        }

        // Verify Assignee exists
        const assignee = await User.findById(data.assignedTo);
        if (!assignee) {
            return NextResponse.json({ error: 'Invalid Assignee ID' }, { status: 400 });
        }

        const task = await Task.create({
            ...data,
            createdBy: (session as any).id
        });

        return NextResponse.json({ task }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Create Task Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
