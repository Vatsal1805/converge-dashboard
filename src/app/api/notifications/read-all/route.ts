import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import { Types } from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userId = new Types.ObjectId((session as any).id);

    // Mark all unread notifications as read
    const result = await Notification.updateMany(
      { userId, isRead: false },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return NextResponse.json({
      message: "All notifications marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
