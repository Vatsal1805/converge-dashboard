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

    // Use $lookup aggregation instead of multiple populates
    const [myProjects, tasks] = await Promise.all([
      Project.aggregate([
        { $match: { teamLeadIds: userId } },
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
      ]),
      Task.find({
        projectId: {
          $in: await Project.find({ teamLeadIds: userId }).distinct("_id"),
        },
      })
        .populate("assignedTo", "name email avatar")
        .populate("projectId", "name")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const relevantProjectsCount = myProjects.filter((p: any) =>
      ["planning", "active"].includes(p.status),
    ).length;
    const activeTasksCount = tasks.filter((t: any) =>
      ["not_started", "in_progress", "working", "under_review"].includes(
        t.status,
      ),
    ).length;

    return NextResponse.json({
      projects: myProjects,
      tasks,
      stats: {
        myActiveProjects: relevantProjectsCount,
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
