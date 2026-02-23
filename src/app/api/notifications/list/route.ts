import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import { Types } from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new Types.ObjectId((session as any).id);

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Build query
    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Fetch notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
