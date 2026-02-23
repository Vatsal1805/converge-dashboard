import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { inAppNotifications } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const project = await Project.findById(id)
      .populate("teamLeadIds", "name email")
      .populate("members", "name email department")
      .lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Fetch Project Detail Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session as any).role;
    if (role !== "founder") {
      return NextResponse.json(
        { error: "Forbidden: Only founders can delete projects" },
        { status: 403 },
      );
    }

    await connectToDatabase();
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete Project Error:", error);
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
    if (role !== "founder" && role !== "teamlead") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    // Get the existing project to compare status change
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate members if provided
    if (body.members && Array.isArray(body.members)) {
      if (body.members.length > 0) {
        const memberUsers = await User.find({
          _id: { $in: body.members },
        }).select("role");

        if (memberUsers.length !== body.members.length) {
          return NextResponse.json(
            { error: "One or more member IDs are invalid" },
            { status: 400 },
          );
        }

        const allInterns = memberUsers.every((u) => u.role === "intern");
        if (!allInterns) {
          return NextResponse.json(
            { error: "All members must be interns" },
            { status: 400 },
          );
        }
      }
    }

    const project = await Project.findByIdAndUpdate(id, body, {
      new: true,
    })
      .populate("teamLeadIds", "name email")
      .populate("members", "name email department");

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Send notification if status changed
    if (body.status && body.status !== existingProject.status) {
      const allMembers = [
        ...project.teamLeadIds.map((tl: any) => tl._id.toString()),
        ...project.members.map((m: any) => m._id.toString())
      ];
      
      await Promise.all(
        allMembers.map(userId =>
          inAppNotifications.projectStatusChanged({
            userId,
            projectId: project._id.toString(),
            projectName: project.name,
            newStatus: body.status
          })
        )
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Update Project Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
