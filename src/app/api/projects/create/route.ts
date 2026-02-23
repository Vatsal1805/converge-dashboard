import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { z } from "zod";
import { cookies } from "next/headers";
import { inAppNotifications, createBulkNotifications } from "@/lib/notifications";

const createProjectSchema = z.object({
  name: z.string().min(2),
  clientName: z.string().min(2),
  description: z.string().optional(),
  teamLeadIds: z
    .array(z.string())
    .min(1, "At least one team lead must be assigned"),
  members: z.array(z.string()).optional(), // Intern IDs assigned to this project
  deadline: z.string().transform((str) => new Date(str)),
  priority: z.enum(["low", "medium", "high"]),
  budget: z.number().nonnegative().optional(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const session = await verifyToken(token || "");

    if (!session || (session as any).role !== "founder") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    await connectToDatabase();

    // Verify all Team Leads exist and have correct role
    const teamLeads = await User.find({
      _id: { $in: data.teamLeadIds },
      role: "teamlead",
    });

    if (teamLeads.length !== data.teamLeadIds.length) {
      return NextResponse.json(
        { error: "One or more invalid Team Lead IDs" },
        { status: 400 },
      );
    }

    // Verify all members (interns) exist and have correct role
    if (data.members && data.members.length > 0) {
      const members = await User.find({
        _id: { $in: data.members },
        role: "intern",
      });

      if (members.length !== data.members.length) {
        return NextResponse.json(
          { error: "One or more invalid intern IDs" },
          { status: 400 },
        );
      }
    }

    const project = await Project.create({
      ...data,
      members: data.members || [],
      createdBy: (session as any).id,
    });

    // Send notifications to team leads and members
    const allAssignees = [...data.teamLeadIds, ...(data.members || [])];
    await Promise.all(
      allAssignees.map(userId =>
        inAppNotifications.projectAssigned({
          userId,
          projectId: project._id.toString(),
          projectName: data.name
        })
      )
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Create Project Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
