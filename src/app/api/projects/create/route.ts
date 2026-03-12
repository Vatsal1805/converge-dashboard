import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { cookies } from "next/headers";
import {
  inAppNotifications,
  createBulkNotifications,
} from "@/lib/notifications";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  handleAPIError,
} from "@/lib/errors";
import { projectSchemas, parseBody } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { cache } from "@/lib/cache";

export async function POST(request: Request) {
  try {
    // ✅ Rate limiting (TEMPORARILY DISABLED FOR DEVELOPMENT)
    // const rateLimitResult = await rateLimit(request, {
    //   maxRequests: 30,
    //   windowMs: 15 * 60 * 1000,
    // });

    // if (rateLimitResult.limited) {
    //   return rateLimitResponse(rateLimitResult.resetTime);
    // }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const session = await verifyToken(token || "");

    if (!session || (session as any).role !== "founder") {
      throw new ForbiddenError("Only founders can create projects");
    }

    // ✅ Centralized validation
    const data = await parseBody(request, projectSchemas.create);

    await connectToDatabase();

    // Verify all Team Leads exist and have correct role
    const teamLeads = await User.find({
      _id: { $in: data.teamLeadIds },
      role: "teamlead",
    });

    if (teamLeads.length !== data.teamLeadIds.length) {
      throw new NotFoundError("One or more invalid Team Lead IDs");
    }

    // Verify all members (interns) exist and have correct role
    if (data.members && data.members.length > 0) {
      const members = await User.find({
        _id: { $in: data.members },
        role: "intern",
      });

      if (members.length !== data.members.length) {
        throw new NotFoundError("One or more invalid intern IDs");
      }
    }

    const project = await Project.create({
      ...data,
      members: data.members || [],
      projectDocument: data.projectDocument || undefined,
      createdBy: (session as any).id,
    });

    await audit.projectCreated({
      creatorId: (session as any).id,
      creatorName: (session as any).name,
      creatorRole: (session as any).role,
      projectId: project._id.toString(),
      projectData: data,
      request,
    });

    // ✅ Invalidate project cache
    cache.invalidateByPrefix("projects:");

    // Send notifications to team leads and members
    const allAssignees = [...data.teamLeadIds, ...(data.members || [])];
    await Promise.all(
      allAssignees.map((userId) =>
        inAppNotifications.projectAssigned({
          userId,
          projectId: project._id.toString(),
          projectName: data.name,
        }),
      ),
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: unknown) {
    // ✅ Centralized error handling
    return handleAPIError(error);
  }
}
