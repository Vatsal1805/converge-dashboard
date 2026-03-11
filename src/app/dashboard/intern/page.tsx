import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckSquare,
  TrendingUp,
  Clock,
  Calendar,
  Briefcase,
} from "lucide-react";
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
import Task from "@/models/Task";
import Project from "@/models/Project";
import { verifyToken } from "@/lib/auth";

async function getInternData(token: string) {
  try {
    // Directly access database from server component
    const session = await verifyToken(token);

    if (!session || (session as any).role !== "intern") {
      console.error("Intern Dashboard: Unauthorized access");
      return {
        tasks: [],
        projects: [],
        stats: { pendingTasks: 0, completedTasks: 0, performanceScore: 0 },
      };
    }

    await connectToDatabase();

    const userId = (session as any).id;

    // Fetch tasks assigned to this intern
    const tasks = await Task.find({ assignedTo: userId })
      .populate("projectId", "name clientName")
      .sort({ deadline: 1 })
      .lean();

    // Fetch projects where this intern is a member
    const projects = await Project.find({ members: userId })
      .populate("teamLeadIds", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const pendingTasks = tasks.filter((t: any) =>
      ["not_started", "in_progress", "working", "under_review"].includes(
        t.status,
      ),
    ).length;

    const completedTasks = tasks.filter(
      (t: any) => t.status === "completed",
    ).length;

    // Get performance score from user (session already has it, but let's be safe)
    const performanceScore = (session as any).performanceScore || 0;

    return {
      tasks: JSON.parse(JSON.stringify(tasks)), // Serialize for client
      projects: JSON.parse(JSON.stringify(projects)), // Serialize for client
      stats: {
        pendingTasks,
        completedTasks,
        performanceScore,
      },
    };
  } catch (error) {
    console.error("Failed to fetch intern dashboard data:", error);
    return {
      tasks: [],
      projects: [],
      stats: { pendingTasks: 0, completedTasks: 0, performanceScore: 0 },
    };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
    case "working":
    case "in_progress":
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

export default async function InternDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || "";
  const data = await getInternData(token);
  const { stats, tasks, projects } = data;

  // Filter for active tasks (not completed)
  const activeTasks = tasks.filter((t: any) => t.status !== "completed");
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
      <h2 className="text-3xl font-bold tracking-tight">Intern Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Pending Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tasks
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Performance Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performanceScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Projects */}
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No projects assigned to you yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black font-bold">
                    Project Name
                  </TableHead>
                  <TableHead className="text-black font-bold">Client</TableHead>
                  <TableHead className="text-black font-bold">
                    Team Lead
                  </TableHead>
                  <TableHead className="text-black font-bold">Status</TableHead>
                  <TableHead className="text-right text-black font-bold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project: any) => {
                  // Calculate task completion for progress tracking
                  const projectTasks = tasks.filter(
                    (t: any) =>
                      typeof t.projectId === "object" &&
                      t.projectId._id === project._id,
                  );
                  const completedTasksCount = projectTasks.filter(
                    (t: any) => t.status === "completed",
                  ).length;
                  const totalTasks = projectTasks.length;

                  // Use actual project status
                  let statusColor =
                    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200";

                  switch (project.status) {
                    case "completed":
                      statusColor =
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
                      break;
                    case "active":
                      statusColor =
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
                      break;
                    case "on_hold":
                      statusColor =
                        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
                      break;
                    case "planning":
                      statusColor =
                        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200";
                      break;
                  }

                  return (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">
                        <span className="text-sm text-black">
                          {project.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">
                          {project.clientName || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">
                          {Array.isArray(project.teamLeadIds) &&
                          project.teamLeadIds.length > 0
                            ? project.teamLeadIds
                                .map((lead: any) =>
                                  typeof lead === "object" ? lead.name : lead,
                                )
                                .join(", ")
                            : "No Team Lead"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColor}>
                          {project.status.replace("_", " ")}
                        </Badge>
                        {totalTasks > 0 && (
                          <span className="ml-2 text-xs text-slate-500">
                            ({completedTasksCount}/{totalTasks} tasks)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={"/projects/" + project._id}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View Project
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* My Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>My Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTasks.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No tasks assigned to you yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black font-bold">Task</TableHead>
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
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-slate-500" />
                        <span className="text-sm text-slate-700">
                          {typeof task.projectId === "object"
                            ? task.projectId.name
                            : "No Project"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(task.status)}
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
                        href={"/my-tasks"}
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
