import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";
import { inAppNotifications } from "@/lib/notifications";
import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { UnauthorizedError, NotFoundError, handleAPIError } from '@/lib/errors';
import { cache } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // ✅ Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000,
    });

    if (rateLimitResult.limited) {
      return rateLimitResponse(rateLimitResult.resetTime);
    }

    const { id } = await params;
    const session = await getUserFromRequest(request);

    if (!session) {
      throw new UnauthorizedError();
    }

    await connectToDatabase();
    const task = await Task.findById(id)
      .populate("projectId", "name clientName")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .lean();

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return NextResponse.json({ task });
  } catch (error: unknown) {
    // ✅ Centralized error handling
    return handleAPIError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // ✅ Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 30,
      windowMs: 15 * 60 * 1000,
    });

    if (rateLimitResult.limited) {
      return rateLimitResponse(rateLimitResult.resetTime);
    }

    const { id } = await params;
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session as any).role;
    if (role !== "founder") {
      return NextResponse.json(
        { error: "Forbidden: Only founders can delete tasks" },
        { status: 403 },
      );
    }

    await connectToDatabase();
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session as any).role;
    const userId = (session as any).id;

    await connectToDatabase();

    // Fetch the task first to check permissions
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Role-based field validation
    const allowedUpdates: Record<string, any> = {};

    // Check what fields are being updated
    const updatingStatus = "status" in body;
    const updatingInternStatus = "internStatus" in body || "internNote" in body;
    const isAssignedIntern = existingTask.assignedTo.toString() === userId;

    // RULE 1: Only assigned intern can update 'status'
    if (updatingStatus) {
      if (!isAssignedIntern) {
        return NextResponse.json(
          {
            error: "Only the assigned intern can update task status",
          },
          { status: 403 },
        );
      }
      allowedUpdates.status = body.status;
    }

    // RULE 2: Only team lead can update 'internStatus' and 'internNote'
    if (updatingInternStatus) {
      if (role !== "teamlead" && role !== "founder") {
        return NextResponse.json(
          {
            error: "Only team leads can update team progress status",
          },
          { status: 403 },
        );
      }
      if ("internStatus" in body)
        allowedUpdates.internStatus = body.internStatus;
      if ("internNote" in body) allowedUpdates.internNote = body.internNote;
    }

    // RULE 3: Other fields can be updated by founder/teamlead
    if (role === "founder" || role === "teamlead") {
      const otherFields = [
        "title",
        "description",
        "priority",
        "deadline",
        "estimatedHours",
        "projectId",
        "assignedTo",
      ];
      otherFields.forEach((field) => {
        if (field in body && !updatingStatus && !updatingInternStatus) {
          allowedUpdates[field] = body[field];
        }
      });
    }

    // If no valid updates, return error
    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        {
          error: "No valid fields to update or insufficient permissions",
        },
        { status: 400 },
      );
    }

    const task = await Task.findByIdAndUpdate(id, allowedUpdates, { new: true })
      .populate("projectId", "name clientName")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    // Send notification if status was updated
    if (updatingStatus && task) {
      await inAppNotifications.taskUpdated({
        userId: task.assignedTo._id.toString(),
        taskId: task._id.toString(),
        taskTitle: task.title,
        newStatus: body.status
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Update Task Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
