import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { UnauthorizedError, handleAPIError } from "@/lib/errors";

/**
 * GET /api/projects/my-projects
 * Get all projects where the current user (intern) is a member
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      throw new UnauthorizedError("Not authenticated");
    }

    const payload = await verifyToken(token);

    if (!payload || !payload.id) {
      throw new UnauthorizedError("Invalid token");
    }

    await connectToDatabase();

    // Find all projects where the user is in the members array
    const projects = await Project.find({
      members: payload.id,
    })
      .populate("teamLeadIds", "name email")
      .populate("members", "name email department")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      projects,
      message: "Projects fetched successfully",
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
