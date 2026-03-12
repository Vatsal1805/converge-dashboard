import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Lead from "@/models/Lead";
import { getUserFromRequest } from "@/lib/jwt";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== "founder") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FETCH DATA IN PARALLEL with $lookup aggregation for projects
    const [totalUsers, totalProjects, activeTasks, wonLeads, projects] =
      await Promise.all([
        User.countDocuments(),
        Project.countDocuments({ status: { $in: ["planning", "active"] } }),
        Task.countDocuments({
          status: {
            $in: ["not_started", "in_progress", "under_review", "working"],
          },
        }),
        Lead.find({ status: "won" }).lean(),
        Project.aggregate([
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
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
              pipeline: [{ $project: { name: 1, email: 1 } }],
              as: "members",
            },
          },
        ]),
      ]);

    const revenue = wonLeads.reduce(
      (acc: number, lead: any) => acc + (lead.dealValue || 0),
      0,
    );

    return NextResponse.json({
      totalUsers,
      totalProjects,
      activeTasks,
      revenue,
      projects,
    });
  } catch (error: any) {
    console.error("Founder Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
