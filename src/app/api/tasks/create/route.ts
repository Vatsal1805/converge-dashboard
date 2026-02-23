import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import Project from '@/models/Project';
import User from '@/models/User';
import { cookies } from 'next/headers';
import { inAppNotifications } from '@/lib/notifications';
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { UnauthorizedError, ForbiddenError, NotFoundError, handleAPIError } from '@/lib/errors';
import { taskSchemas, parseBody } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { cache } from '@/lib/cache';

export async function POST(request: Request) {
    try {
        // ✅ Rate limiting
        const rateLimitResult = await rateLimit(request, {
            maxRequests: 50,
            windowMs: 15 * 60 * 1000,
        });

        if (rateLimitResult.limited) {
            return rateLimitResponse(rateLimitResult.resetTime);
        }

        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const session = await verifyToken(token || '');

        if (!session || ((session as any).role !== 'founder' && (session as any).role !== 'teamlead')) {
            throw new ForbiddenError('Only founders and team leads can create tasks');
        }

        // ✅ Centralized validation
        const data = await parseBody(request, taskSchemas.create);

        await connectToDatabase();

        // Verify Project exists
        const project = await Project.findById(data.projectId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }

        // Verify Assignee exists
        const assignee = await User.findById(data.assignedTo);
        if (!assignee) {
            throw new NotFoundError('Assignee not found');
        }

        const task = await Task.create({
            ...data,
            status: 'not_started',
            createdBy: (session as any).id
        });

        // ✅ Audit logging
        await audit.taskAssigned({
            assignerId: (session as any).id,
            assignerName: (session as any).name,
            assignerRole: (session as any).role,
            taskId: task._id.toString(),
            taskTitle: data.title,
            assignedToId: data.assignedTo,
            assignedToName: assignee.name,
            request,
        });

        // ✅ Invalidate task cache
        cache.invalidateByPrefix('tasks:list:');

        // Send notification to assigned user
        await inAppNotifications.taskAssigned({
            userId: data.assignedTo,
            taskId: task._id.toString(),
            taskTitle: data.title,
            projectName: project.name
        });

        return NextResponse.json({ task }, { status: 201 });

    } catch (error: unknown) {
        // ✅ Centralized error handling
        return handleAPIError(error);
    }
}
