import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import { Types } from "mongoose";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const userId = new Types.ObjectId((session as any).id);

    // Mark notification as read (only if it belongs to the user)
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true },
    );

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
