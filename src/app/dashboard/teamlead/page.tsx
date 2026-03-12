import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckSquare, Users, Calendar } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { verifyToken } from "@/lib/auth";
import { Types } from "mongoose";

async function getTeamLeadData(token: string) {
  try {
    // Directly access database from server component
    const session = await verifyToken(token);

    if (!session || (session as any).role !== "teamlead") {
      console.error("Team Lead Dashboard: Unauthorized access");
      return {
        projects: [],
        tasks: [],
        stats: { myActiveProjects: 0, teamActiveTasks: 0 },
      };
    }

    await connectToDatabase();

    const userId = new Types.ObjectId((session as any).id);

    const myProjects = await Project.find({ teamLeadIds: userId })
      .populate("teamLeadIds", "name email")
      .populate("members", "name email department")
      .lean();

    const projectIds = myProjects.map((p) => p._id);

    // Get all tasks under these projects
    const tasks = await Task.find({ projectId: { $in: projectIds } })
      .populate("assignedTo", "name email avatar")
      .populate("projectId", "name")
      .sort({ updatedAt: -1 })
      .lean();

    const relevantProjectsCount = myProjects.filter((p: any) =>
      ["planning", "active"].includes(p.status),
    ).length;

    const activeTasksCount = tasks.filter((t: any) =>
      ["not_started", "in_progress", "working", "under_review"].includes(
        t.status,
      ),
    ).length;

    return {
      projects: JSON.parse(JSON.stringify(myProjects)), // Serialize for client
      tasks: JSON.parse(JSON.stringify(tasks)),
      stats: {
        myActiveProjects: relevantProjectsCount,
        teamActiveTasks: activeTasksCount,
      },
    };
  } catch (error) {
    console.error("Failed to fetch team lead data:", error);
    return {
      projects: [],
      tasks: [],
      stats: { myActiveProjects: 0, teamActiveTasks: 0 },
    };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    case "planning":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "completed":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    case "on_hold":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50 border-red-100";
    case "medium":
      return "text-amber-600 bg-amber-50 border-amber-100";
    case "low":
      return "text-green-600 bg-green-50 border-green-100";
    default:
      return "";
  }
}

function getTaskStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
    case "in_progress":
    case "working":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
    case "under_review":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200";
    case "on_hold":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
    case "not_started":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function TeamLeadDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || "";
  const data = await getTeamLeadData(token);
  const { stats, projects, tasks } = data;

  // Filter for active projects only
  const activeProjects = projects.filter((p: any) =>
    ["planning", "active"].includes(p.status),
  );

  // Sort tasks: Active tasks first, completed tasks last
  const sortedTasks = [...tasks].sort((a: any, b: any) => {
    const statusOrder: Record<string, number> = {
      not_started: 1,
      in_progress: 2,
      working: 3,
      under_review: 4,
      on_hold: 5,
      completed: 6,
    };
    const orderA = statusOrder[a.status] || 999;
    const orderB = statusOrder[b.status] || 999;

    // If same status, sort by deadline
    if (orderA === orderB) {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return dateA - dateB;
    }

    return orderA - orderB;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Team Lead Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Active Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myActiveProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Active Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamActiveTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>My Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No active projects assigned to you.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black font-bold">
                    Project
                  </TableHead>
                  <TableHead className="text-black font-bold">Status</TableHead>
                  <TableHead className="text-black font-bold">
                    Priority
                  </TableHead>
                  <TableHead className="text-black font-bold">
                    Deadline
                  </TableHead>
                  <TableHead className="text-black font-bold">
                    Team Members
                  </TableHead>
                  <TableHead className="text-right text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProjects.map((project: any) => (
                  <TableRow key={project._id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-black">
                          {project.name}
                        </span>
                        <span className="text-xs text-slate-700">
                          {project.clientName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(project.status)}
                      >
                        {project.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(project.priority)}
                      >
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-black">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString()
                          : "No deadline"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-black">
                        <Users className="h-3 w-3 text-slate-500" />
                        <span>
                          {Array.isArray(project.members) &&
                          project.members.length > 0
                            ? `${project.members.length} intern${project.members.length > 1 ? "s" : ""}`
                            : "No members"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/projects/${project._id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Team Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTasks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No tasks found in your projects.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black font-bold">Task</TableHead>
                  <TableHead className="text-black font-bold">
                    Project
                  </TableHead>
                  <TableHead className="text-black font-bold">
                    Assigned To
                  </TableHead>
                  <TableHead className="text-black font-bold">Status</TableHead>
                  <TableHead className="text-black font-bold">
                    Priority
                  </TableHead>
                  <TableHead className="text-black font-bold">
                    Deadline
                  </TableHead>
                  <TableHead className="text-right text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map((task: any) => (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">
                      <span className="text-sm text-black">{task.title}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-700">
                        {typeof task.projectId === "object"
                          ? task.projectId.name
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-slate-500" />
                        <span className="text-sm text-black">
                          {typeof task.assignedTo === "object"
                            ? task.assignedTo.name
                            : "Unassigned"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getTaskStatusColor(task.status)}
                      >
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPriorityColor(task.priority)}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-black">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString()
                          : "No deadline"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/tasks/${task._id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
