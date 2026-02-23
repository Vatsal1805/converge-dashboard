import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { inAppNotifications } from "@/lib/notifications";
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { UnauthorizedError, ForbiddenError, NotFoundError, handleAPIError } from '@/lib/errors';
import { taskSchemas, parseBody } from '@/lib/validation';
import { audit } from '@/lib/audit';
import { cache } from '@/lib/cache';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      throw new UnauthorizedError();
    }

    const session = await verifyToken(token);
    if (!session) {
      throw new UnauthorizedError();
    }

    const { id } = await params;
    
    // ✅ Centralized validation
    const { internStatus, internNote } = await parseBody(request, taskSchemas.updateInternStatus);

    await connectToDatabase();

    // Find the task and verify it's assigned to this intern
    const task = await Task.findById(id);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify the task is assigned to this user
    if (task.assignedTo.toString() !== (session as any).id) {
      throw new ForbiddenError('Not authorized to update this task');
    }

    // Update intern status
    const updateData: Record<string, unknown> = {};
    const oldStatus = task.status;
    
    if (internStatus) {
      updateData.internStatus = internStatus;
      // If intern marks as started, also update main status to in_progress
      if (internStatus === "started" && task.status === "not_started") {
        updateData.status = "in_progress";
      }
    }
    if (internNote !== undefined) {
      updateData.internNote = internNote;
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("projectId", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name");

    // ✅ Audit logging
    if (updateData.status && updateData.status !== oldStatus) {
      await audit.taskStatusChanged({
        userId: (session as any).id,
        userName: (session as any).name,
        userRole: (session as any).role,
        taskId: id,
        oldStatus: oldStatus,
        newStatus: updateData.status as string,
        request,
      });
    }

    // ✅ Invalidate task cache
    cache.invalidateByPrefix('tasks:');

    // Send emergency notification if intern marks task as emergency
    if (internStatus === 'emergency' && updatedTask) {
      await inAppNotifications.taskEmergency({
        userId: updatedTask.createdBy._id.toString(),
        taskId: updatedTask._id.toString(),
        taskTitle: updatedTask.title,
        internName: (updatedTask.assignedTo as any).name
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: unknown) {
    // ✅ Centralized error handling
    return handleAPIError(error);
  }
}
