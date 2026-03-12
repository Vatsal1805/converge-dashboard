import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import User from "@/models/User";
import Project from "@/models/Project";
import { getUserFromRequest } from "@/lib/jwt";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== "intern") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new Types.ObjectId(user.id);

    // Fetch all data in parallel using $lookup for projects
    const [tasks, projects, pendingTasksCount, completedTasksCount, userData] =
      await Promise.all([
        Task.find({ assignedTo: userId })
          .populate("projectId", "name clientName")
          .sort({ deadline: 1 })
          .lean(),
        Project.aggregate([
          { $match: { members: userId } },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "users",
              localField: "teamLeadIds",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1, email: 1 } }],
              as: "teamLeadIds",
            },
          },
        ]),
        Task.countDocuments({
          assignedTo: userId,
          status: { $in: ["not_started", "in_progress", "working"] },
        }),
        Task.countDocuments({ assignedTo: userId, status: "completed" }),
        User.findById(userId).select("performanceScore").lean(),
      ]);

    return NextResponse.json({
      tasks,
      projects,
      stats: {
        pendingTasks: pendingTasksCount,
        completedTasks: completedTasksCount,
        performanceScore: userData?.performanceScore || 0,
      },
    });
  } catch (error: any) {
    console.error("Intern Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
