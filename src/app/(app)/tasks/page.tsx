"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  AlertCircle,
  CircleDot,
  Clock,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/SessionProvider";
import { storage } from "@/lib/storage";

interface Task {
  _id: string;
  title: string;
  projectId: { _id: string; name: string; clientName: string };
  assignedTo: { _id: string; name: string; email: string };
  priority: "low" | "medium" | "high";
  status:
    | "not_started"
    | "in_progress"
    | "working"
    | "on_hold"
    | "under_review"
    | "completed";
  internStatus?: "not_started" | "started" | "issue" | "emergency" | "other";
  internNote?: string;
  deadline: string;
}

interface Project {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function TasksPage() {
  const router = useRouter();
  const { user: currentUser, loading: sessionLoading } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    priority: "medium" as "low" | "medium" | "high",
    deadline: "",
    estimatedHours: 0,
  });

  // Status update handler - Only for assigned interns
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks/" + taskId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks(
          tasks.map((t) =>
            t._id === taskId ? { ...t, status: newStatus as any } : t,
          ),
        );
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Team progress update handler - Only for team leads
  const handleTeamProgressChange = async (
    taskId: string,
    newInternStatus: string,
  ) => {
    try {
      const res = await fetch("/api/tasks/" + taskId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internStatus: newInternStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(tasks.map((t) => (t._id === taskId ? data.task : t)));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update team progress");
      }
    } catch (err) {
      console.error("Failed to update team progress", err);
    }
  };

  // Fetch interns for specific project
  const fetchInternsForProject = async (projectId: string) => {
    try {
      const url = projectId
        ? "/api/teams/interns?projectId=" + projectId
        : "/api/teams/interns";
      const res = await fetch(url);

      if (!res.ok) {
        console.error("Failed to fetch interns:", res.status, res.statusText);
        const errorData = await res.json().catch(() => ({}));
        console.error("Error details:", errorData);
        setUsers([]);
        return;
      }

      const data = await res.json();
      const usersList = Array.isArray(data)
        ? data
        : data.interns || data.users || [];
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to fetch interns", err);
      setUsers([]);
    }
  };

  const handleCreateTask = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh tasks list
        const tasksRes = await fetch("/api/tasks/list");
        const tasksData = await tasksRes.json();
        if (tasksData.tasks) {
          setTasks(tasksData.tasks);
        }
        setIsDialogOpen(false);
        setFormData({
          title: "",
          description: "",
          projectId: "",
          assignedTo: "",
          priority: "medium",
          deadline: "",
          estimatedHours: 0,
        });
        // Clear users list when closing dialog
        setUsers([]);
      } else {
        const error = await res.json();
        console.error("Create task error:", error);
      }
    } catch (err) {
      console.error("Failed to create task", err);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    // Load from cache first for instant display
    const cachedTasks = storage.get<Task[]>("tasks_cache");
    const cachedProjects = storage.get<Project[]>("projects_dropdown_cache");
    // Don't load users from cache initially - they should be loaded per project

    if (cachedTasks) setTasks(cachedTasks);
    if (cachedProjects) setProjects(cachedProjects);

    if (cachedTasks && cachedProjects) {
      setLoading(false);
    }

    const fetchData = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const lastModified = storage.get<string>("tasks_last_modified");

        // Add scope=me for team leads to filter only their tasks
        const scopeParam = currentUser?.role === "teamlead" ? "&scope=me" : "";
        const tasksUrl = lastModified
          ? "/api/tasks/list?since=" +
            encodeURIComponent(lastModified) +
            scopeParam
          : "/api/tasks/list" +
            (currentUser?.role === "teamlead" ? "?scope=me" : "");

        // Only fetch tasks and projects initially, NOT interns
        // Interns will be fetched when a project is selected
        const [tasksRes, projectsRes] = await Promise.all([
          fetch(tasksUrl),
          fetch("/api/projects/list"),
        ]);

        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();

        if (tasksData.modified !== false) {
          const tasksList = Array.isArray(tasksData)
            ? tasksData
            : tasksData.tasks || [];
          setTasks(tasksList);
          storage.set("tasks_cache", tasksList);
          if (tasksData.lastModified) {
            storage.set("tasks_last_modified", tasksData.lastModified);
          }
        }

        const projectsList = Array.isArray(projectsData)
          ? projectsData
          : projectsData.projects || [];

        setProjects(projectsList);
        storage.set("projects_dropdown_cache", projectsList);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData(!(cachedTasks && cachedProjects));
  }, []);

  // Fetch interns when project selection changes
  useEffect(() => {
    if (formData.projectId) {
      fetchInternsForProject(formData.projectId);
      // Clear assignedTo since available interns may have changed
      setFormData((prev) => ({ ...prev, assignedTo: "" }));
    } else {
      // No project selected, clear interns list
      setUsers([]);
      setFormData((prev) => ({ ...prev, assignedTo: "" }));
    }
  }, [formData.projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "working":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "on_hold":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "under_review":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getInternStatusBadge = (internStatus?: string, internNote?: string) => {
    const noteTooltip = internNote ? " - " + internNote : "";
    switch (internStatus) {
      case "started":
        return (
          <Badge
            className="bg-blue-100 text-blue-800 border-blue-200"
            title={"Started" + noteTooltip}
          >
            <CircleDot className="h-3 w-3 mr-1" />
            Started
          </Badge>
        );
      case "issue":
        return (
          <Badge
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
            title={"Issue" + noteTooltip}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Issue
          </Badge>
        );
      case "emergency":
        return (
          <Badge
            className="bg-red-100 text-red-800 border-red-200"
            title={"Emergency" + noteTooltip}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Emergency
          </Badge>
        );
      case "other":
        return (
          <Badge
            className="bg-gray-100 text-gray-800 border-gray-200"
            title={"Other" + noteTooltip}
          >
            Other
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Client-side filtering for team leads as a fallback
    if (currentUser?.role === "teamlead" && currentUser.id) {
      filtered = filtered.filter((task) => {
        // Get the project for this task
        const projectId =
          typeof task.projectId === "object"
            ? task.projectId._id
            : task.projectId;
        // This is a simple check - ideally we'd check if the project belongs to this team lead
        // But since API already filters, this is mainly a fallback
        return true; // API filtering should handle this
      });
    }

    // Sort tasks: Active tasks first, completed tasks last
    const sorted = [...filtered].sort((a, b) => {
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

      // If same status, sort by deadline (earliest first)
      if (orderA === orderB) {
        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();
        return dateA - dateB;
      }

      return orderA - orderB;
    });

    return sorted;
  }, [tasks, currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black">
            Tasks
          </h2>
          <p className="text-slate-600">
            Manage your tasks and track progress.
          </p>
        </div>
        {(currentUser?.role === "founder" ||
          currentUser?.role === "teamlead") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-black hover:text-black">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new task.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter task title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Task description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project">Project</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, projectId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignee">Assign To</Label>
                    <Select
                      value={formData.assignedTo}
                      onValueChange={(v) =>
                        setFormData({ ...formData, assignedTo: v })
                      }
                      disabled={!formData.projectId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !formData.projectId
                              ? "Select project first"
                              : users.length === 0
                                ? "No interns in this project"
                                : "Select intern"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No interns available
                          </SelectItem>
                        ) : (
                          users.map((u) => (
                            <SelectItem key={u._id} value={u._id}>
                              {u.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) =>
                        setFormData({ ...formData, priority: v as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hours">Estimated Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min={0}
                    value={formData.estimatedHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedHours: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-black hover:text-black"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  disabled={
                    creating ||
                    !formData.title ||
                    !formData.projectId ||
                    !formData.assignedTo
                  }
                  className="text-black hover:text-black"
                >
                  {creating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black font-bold">Task</TableHead>
                <TableHead className="text-black font-bold">Project</TableHead>
                <TableHead className="text-black font-bold">Assignee</TableHead>
                <TableHead className="text-black font-bold">Priority</TableHead>
                <TableHead className="text-black font-bold">Deadline</TableHead>
                <TableHead className="text-black font-bold">Status</TableHead>
                <TableHead className="text-black font-bold">
                  Team Progress
                </TableHead>
                <TableHead className="text-right text-black font-bold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={"skeleton-" + i}>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[60px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[100px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-[80px] ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : tasks.length === 0 ? (
                <TableRow key="empty">
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTasks.map((task) => (
                  <TableRow key={task._id} className="group">
                    <TableCell className="font-medium text-black">
                      {task.title}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {task.projectId ? task.projectId.name : "Unknown Project"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-black">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center">
                          <UserIcon className="h-3 w-3 text-slate-500" />
                        </div>
                        {task.assignedTo ? task.assignedTo.name : "Unassigned"}
                      </div>
                    </TableCell>
                    <TableCell className="text-black capitalize">
                      {task.priority}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-black">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Only assigned intern can change status */}
                      {currentUser?.id === task.assignedTo?._id ? (
                        <Select
                          defaultValue={task.status}
                          onValueChange={(v) => handleStatusChange(task._id, v)}
                        >
                          <SelectTrigger
                            className={
                              "w-[130px] h-8 " + getStatusColor(task.status)
                            }
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">
                              Not Started
                            </SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="working">Working</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="under_review">
                              Under Review
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          variant="outline"
                          className={getStatusColor(task.status)}
                        >
                          {task.status.toUpperCase().replace("_", " ")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Only team lead can change team progress */}
                      {currentUser?.role === "teamlead" ||
                      currentUser?.role === "founder" ? (
                        <Select
                          defaultValue={task.internStatus || "not_started"}
                          onValueChange={(v) =>
                            handleTeamProgressChange(task._id, v)
                          }
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">
                              Not Started
                            </SelectItem>
                            <SelectItem value="started">Started</SelectItem>
                            <SelectItem value="issue">Issue</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getInternStatusBadge(task.internStatus, task.internNote)
                      )}
                      {task.internNote && (
                        <div
                          className="text-xs text-slate-600 mt-1 max-w-[150px] truncate"
                          title={task.internNote}
                        >
                          {task.internNote}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      {currentUser?.role === "founder" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            if (
                              confirm(
                                "Are you sure you want to delete this task?",
                              )
                            ) {
                              try {
                                const res = await fetch(
                                  "/api/tasks/" + task._id,
                                  { method: "DELETE" },
                                );
                                if (res.ok) {
                                  setTasks(
                                    tasks.filter((t) => t._id !== task._id),
                                  );
                                }
                              } catch (err) {
                                console.error("Delete error:", err);
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className=" text-black  hover:text-black"
                        onClick={() => router.push("/tasks/" + task._id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
