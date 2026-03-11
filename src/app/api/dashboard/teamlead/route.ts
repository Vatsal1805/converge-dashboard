import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
import { getUserFromRequest } from "@/lib/jwt";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== "teamlead") {
      console.error("Team Lead Dashboard: Unauthorized access attempt", user);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new Types.ObjectId(user.id);
    console.log("Team Lead Dashboard: Fetching data for user", user.id);

    // 1. Get all projects where this user is one of the Team Leads
    const myProjects = await Project.find({ teamLeadIds: userId }).lean();
    const projectIds = myProjects.map((p) => p._id);
    console.log(
      "Team Lead Dashboard: Found",
      myProjects.length,
      "projects for user",
      user.id,
    );

    // 2. Get all tasks under these projects
    // Important: DO NOT filter by assignedTo for team lead.
    const tasks = await Task.find({ projectId: { $in: projectIds } })
      .populate("assignedTo", "name email avatar")
      .populate("projectId", "name")
      .sort({ updatedAt: -1 })
      .lean();
    console.log(
      "Team Lead Dashboard: Found",
      tasks.length,
      "tasks across",
      projectIds.length,
      "projects",
    );

    // 3. Calculate stats
    const relevantProjectsCount = myProjects.filter((p) =>
      ["planning", "active"].includes(p.status),
    ).length;
    const activeTasksCount = tasks.filter((t) =>
      ["not_started", "in_progress", "working", "under_review"].includes(
        t.status,
      ),
    ).length;

    return NextResponse.json({
      projects: myProjects,
      tasks,
      stats: {
        myActiveProjects: relevantProjectsCount, // Keeping name for compatibility or changing it
        teamActiveTasks: activeTasksCount,
      },
    });
  } catch (error: any) {
    console.error("Team Lead Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
