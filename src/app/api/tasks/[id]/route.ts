import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import Project from '@/models/Project';
import User from '@/models/User';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getUserFromRequest(request);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();
        const task = await Task.findById(id)
            .populate('projectId', 'name clientName')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .lean();

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Fetch Task Detail Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getUserFromRequest(request);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session as any).role;
        if (role !== 'founder') {
            return NextResponse.json({ error: 'Forbidden: Only founders can delete tasks' }, { status: 403 });
        }

        await connectToDatabase();
        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete Task Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const session = await getUserFromRequest(request);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = (session as any).role;
        if (role !== 'founder' && role !== 'teamlead') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectToDatabase();
        const task = await Task.findByIdAndUpdate(id, body, { new: true })
            .populate('projectId', 'name clientName')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        return NextResponse.json({ task });
    } catch (error) {
        console.error('Update Task Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
