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

    // Count unread notifications
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Count Notifications Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
