import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { cookies } from 'next/headers';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');
        const userRole = (session as any)?.role;
        const userId = (session as any)?.id;

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        await connectToDatabase();

        const task = await Task.findById(params.id);
        if (!task) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        }

        // Authorization checks
        if (userRole === 'intern' && task.assignedTo.toString() !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Role-specific updates
        if (userRole === 'intern') {
            // Intern can only update status to 'in_progress', 'review' and log hours
            if (body.status) {
                if (!['todo', 'in_progress', 'review'].includes(body.status)) {
                    return NextResponse.json({ error: 'Interns cannot complete/reject tasks directly' }, { status: 400 });
                }
                task.status = body.status;
            }
            if (body.hoursLogged) {
                task.hoursLogged = (task.hoursLogged || 0) + Number(body.hoursLogged);
            }
        } else {
            // Founder/TeamLead can update everything including status to 'completed'/'rejected'
            if (body.status) task.status = body.status;
            if (body.priority) task.priority = body.priority;
            if (body.hoursLogged) task.hoursLogged = body.hoursLogged; // Absolute set or add? Let's assume absolute or handled by client
            if (body.reviewNote) task.reviewNote = body.reviewNote;

            // Performance Logic
            if (body.status === 'completed' && task.status !== 'completed') {
                const assignee = await User.findById(task.assignedTo);
                if (assignee) {
                    // Check if on time
                    const isLate = new Date() > new Date(task.deadline);
                    const scoreDelta = isLate ? 1 : 2; // +2 if on time, +1 if late (simple rule? User req said "+2 if on time")
                    // User req: "If rejected: -1 score"
                    assignee.performanceScore = (assignee.performanceScore || 0) + scoreDelta;
                    await assignee.save();
                }
            } else if (body.status === 'rejected' && task.status !== 'rejected') {
                const assignee = await User.findById(task.assignedTo);
                if (assignee) {
                    assignee.performanceScore = (assignee.performanceScore || 0) - 1;
                    await assignee.save();
                }
            }
        }

        await task.save();

        return NextResponse.json({ task });

    } catch (error) {
        console.error('Update Task Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
