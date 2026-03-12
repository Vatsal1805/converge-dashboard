import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { inAppNotifications } from "@/lib/notifications";
import { deleteFromCloudinary } from "@/lib/fileStorage";
import mongoose from "mongoose";

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

    // Use $lookup aggregation instead of multiple populate calls (1 query vs 3)
    const results = await Project.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "teamLeadIds",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1 } }],
          as: "teamLeadIds",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, department: 1 } }],
          as: "members",
        },
      },
    ]);

    const project = results[0] || null;

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
    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.projectDocument?.url) {
      const publicId = extractPublicIdFromUrl(project.projectDocument.url);
      if (publicId) {
        await deleteFromCloudinary(publicId, "raw");
      }
    }

    await Project.findByIdAndDelete(id);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Helper function to extract Cloudinary public_id from URL
function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
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
    if (role !== "founder") {
      return NextResponse.json(
        { error: "Forbidden: Only founders can edit projects" },
        { status: 403 },
      );
    }

    await connectToDatabase();

    // Get the existing project to compare status change
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Handle file deletion from Cloudinary if projectDocument is being removed or replaced
    if (body.projectDocument === null && existingProject.projectDocument?.url) {
      const publicId = extractPublicIdFromUrl(
        existingProject.projectDocument.url,
      );
      if (publicId) {
        await deleteFromCloudinary(publicId, "raw");
      }
    } else if (
      body.projectDocument &&
      body.projectDocument.url !== existingProject.projectDocument?.url &&
      existingProject.projectDocument?.url
    ) {
      const oldPublicId = extractPublicIdFromUrl(
        existingProject.projectDocument.url,
      );
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId, "raw");
      }
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
        ...project.members.map((m: any) => m._id.toString()),
      ];

      await inAppNotifications.projectStatusChanged({
        userIds: allMembers,
        projectId: project._id.toString(),
        projectName: project.name,
        newStatus: body.status,
      });
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
