import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const body = await request.json();
        const { internStatus, internNote } = body;

        await connectToDatabase();

        // Find the task and verify it's assigned to this intern
        const task = await Task.findById(id);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Verify the task is assigned to this user
        if (task.assignedTo.toString() !== (session as any).id) {
            return NextResponse.json({ error: 'Not authorized to update this task' }, { status: 403 });
        }

        // Update intern status
        const updateData: Record<string, unknown> = {};
        if (internStatus) {
            updateData.internStatus = internStatus;
            // If intern marks as started, also update main status to in_progress
            if (internStatus === 'started' && task.status === 'todo') {
                updateData.status = 'in_progress';
            }
        }
        if (internNote !== undefined) {
            updateData.internNote = internNote;
        }

        const updatedTask = await Task.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('projectId', 'name')
         .populate('assignedTo', 'name email')
         .populate('createdBy', 'name');

        return NextResponse.json({ task: updatedTask });
    } catch (error: any) {
        console.error('Update task status error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update task' },
            { status: 500 }
        );
    }
}
