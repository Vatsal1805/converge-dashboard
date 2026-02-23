import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const role = (session as any).role;
    const userId = new Types.ObjectId((session as any).id);
    const scope = searchParams.get("scope");

    let query: any = {};

    if (scope === "me") {
      if (role === "teamlead") {
        query = { teamLeadIds: userId };
      } else if (role === "intern") {
        // Interns usually don't have "their" projects, but we can return nothing
        // or just assignments if we add a field later. For now, we follow current logic.
        query = { _id: { $exists: false } };
      }
    } else {
      // Global view (default) - accessible by all logged in users
    }

    const since = searchParams.get("since");

    // Check for latest modification in the results
    const latestUpdate = await Project.findOne(query)
      .sort({ updatedAt: -1 })
      .select("updatedAt")
      .lean();

    const latestTimestamp = latestUpdate
      ? (latestUpdate as any).updatedAt.toISOString()
      : null;

    // If client provided 'since' and nothing changed, return early
    if (since && latestTimestamp && latestTimestamp <= since) {
      return NextResponse.json({
        modified: false,
        lastModified: latestTimestamp,
      });
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate({
          path: "teamLeadIds",
          select: "name email",
        })
        .populate({
          path: "members",
          select: "name email department",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(query),
    ]);

    return NextResponse.json({
      projects,
      modified: true,
      lastModified: latestTimestamp,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List Projects Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
