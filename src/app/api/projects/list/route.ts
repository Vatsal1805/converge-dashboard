import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import { Types } from "mongoose";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { UnauthorizedError, handleAPIError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    // ✅ Rate limiting
    const rateLimitResult = await rateLimit(request, {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000,
    });

    if (rateLimitResult.limited) {
      return rateLimitResponse(rateLimitResult.resetTime);
    }

    const session = await getUserFromRequest(request);

    if (!session) {
      throw new UnauthorizedError();
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );
    const skip = (page - 1) * limit;

    const role = (session as any).role;
    const userId = new Types.ObjectId((session as any).id);
    const scope = searchParams.get("scope");

    let matchStage: any = {};

    if (scope === "me") {
      if (role === "teamlead") {
        matchStage = { teamLeadIds: userId };
      } else if (role === "intern") {
        matchStage = { _id: { $exists: false } };
      }
    }

    const since = searchParams.get("since");

    // Check for latest modification in the results
    const latestUpdate = await Project.findOne(matchStage)
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

    // Use $lookup aggregation with server-side pagination
    const [projects, countResult] = await Promise.all([
      Project.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
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
      Project.countDocuments(matchStage),
    ]);

    const total = countResult;

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
  } catch (error: unknown) {
    // ✅ Centralized error handling
    return handleAPIError(error);
  }
}
