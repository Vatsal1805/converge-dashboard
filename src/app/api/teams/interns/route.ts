import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Team from "@/models/Team";
import User from "@/models/User";
import Project from "@/models/Project";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const role = (session as any).role;
    const userId = new Types.ObjectId((session as any).id);

    let internIds: any[] = [];

    if (role === "founder") {
      // If projectId is specified, return only interns in that project
      if (projectId) {
        const project = await Project.findById(projectId)
          .select("members")
          .lean();
        if (project && project.members) {
          internIds = project.members;
        } else {
          // No members in project, return empty
          return NextResponse.json({ interns: [] });
        }
      } else {
        // No projectId, return all interns
        const allInterns = await User.find({ role: "intern", status: "active" })
          .select("_id name email department performanceScore")
          .sort({ name: 1 })
          .lean();
        return NextResponse.json({ interns: allInterns });
      }
    } else if (role === "teamlead") {
      // Team leads can see interns from their team AND projects they're assigned to
      if (projectId) {
        const project = await Project.findOne({
          _id: projectId,
          teamLeadIds: userId,
        })
          .select("members")
          .lean();

        if (!project) {
          return NextResponse.json(
            { error: "Project not found or not authorized" },
            { status: 404 },
          );
        }

        internIds = project.members || [];
      } else {
        // No projectId, get interns from:
        // 1. Team where this user is team lead
        // 2. Projects where this team lead is assigned
        const allMemberIds = new Set<string>();

        // Get interns from team
        const teams = await Team.find({
          teamLeadId: userId,
          status: "active",
        })
          .select("members")
          .lean();

        teams.forEach((team) => {
          if (team.members) {
            team.members.forEach((memberId: any) => {
              allMemberIds.add(memberId.toString());
            });
          }
        });

        // Get interns from projects
        const projects = await Project.find({
          teamLeadIds: userId,
          status: { $in: ["planning", "active"] },
        })
          .select("members")
          .lean();

        projects.forEach((project) => {
          if (project.members) {
            project.members.forEach((memberId: any) => {
              allMemberIds.add(memberId.toString());
            });
          }
        });

        internIds = Array.from(allMemberIds).map(
          (id) => new Types.ObjectId(id),
        );
      }
    } else {
      // Interns shouldn't assign tasks
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch intern details
    const interns = await User.find({
      _id: { $in: internIds },
      role: "intern",
      status: "active",
    })
      .select("_id name email department performanceScore")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ interns });
  } catch (error) {
    console.error("Get Team Interns Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
