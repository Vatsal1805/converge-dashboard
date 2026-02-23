"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  FolderKanban,
  CheckSquare,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  Award,
} from "lucide-react";

interface Analytics {
  overview: {
    totalUsers: number;
    totalInterns: number;
    totalTeamLeads: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    totalLeads: number;
    wonLeads: number;
    overdueTasks: number;
    taskCompletionRate: number;
    leadConversionRate: number;
  };
  topPerformers: {
    _id: string;
    name: string;
    email: string;
    department: string;
    performanceScore: number;
  }[];
  recentProjects: {
    _id: string;
    name: string;
    clientName: string;
    status: string;
    priority: string;
    deadline: string;
    teamLeadIds?: { _id: string; name: string }[];
  }[];
  departmentStats: { _id: string; count: number; avgScore: number }[];
  tasksByStatus: { _id: string; count: number }[];
  leadsByStatus: { _id: string; count: number }[];
}

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/reports/analytics");
      const data = await res.json();
      if (data.overview) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "planning":
        return "bg-purple-100 text-purple-700";
      case "on_hold":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Unable to load analytics</h3>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const {
    overview,
    topPerformers,
    recentProjects,
    departmentStats,
    tasksByStatus,
    leadsByStatus,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-emerald-500" />
          Reports & Analytics
        </h2>
        <p className="text-muted-foreground">
          Full overview of your organization's performance and metrics.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalInterns} interns, {overview.totalTeamLeads} team
              leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeProjects} active, {overview.completedProjects}{" "}
              completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Task Completion
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.taskCompletionRate}%
            </div>
            <Progress
              value={overview.taskCompletionRate}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lead Conversion
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.leadConversionRate}%
            </div>
            <Progress
              value={overview.leadConversionRate}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Alert Cards */}
      {overview.overdueTasks > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {overview.overdueTasks} Overdue Tasks
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                These tasks have passed their deadline and need attention.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Tasks Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Tasks Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasksByStatus.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(item._id)}
                      >
                        {item._id?.replace("_", " ") || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((item.count / overview.totalTasks) * 100)}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tasks</span>
                    <span className="font-bold">{overview.totalTasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leads Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Leads Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {leadsByStatus.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          item._id === "won"
                            ? "bg-green-100 text-green-700"
                            : item._id === "new"
                              ? "bg-blue-100 text-blue-700"
                              : item._id === "contacted"
                                ? "bg-amber-100 text-amber-700"
                                : item._id === "lost"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-700"
                        }
                      >
                        {item._id || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-muted-foreground">
                        (
                        {overview.totalLeads > 0
                          ? Math.round((item.count / overview.totalLeads) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Leads</span>
                    <span className="font-bold">{overview.totalLeads}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Interns with highest performance scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topPerformers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No performance data yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topPerformers.map((performer, index) => (
                      <div
                        key={performer._id}
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? "bg-amber-100 text-amber-700"
                              : index === 1
                                ? "bg-slate-200 text-slate-700"
                                : index === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {performer.department}
                          </p>
                        </div>
                        <Badge
                          className={
                            performer.performanceScore >= 80
                              ? "bg-green-100 text-green-700"
                              : performer.performanceScore >= 60
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                          }
                        >
                          {performer.performanceScore}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Department Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Department Performance
                </CardTitle>
                <CardDescription>
                  Average performance by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                {departmentStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No department data yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {departmentStats.map((dept) => (
                      <div key={dept._id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {dept._id || "Unknown"}
                          </span>
                          <span className="text-muted-foreground">
                            {dept.count} interns •{" "}
                            {Math.round(dept.avgScore || 0)}% avg
                          </span>
                        </div>
                        <Progress value={dept.avgScore || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Latest projects in the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No projects yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Team Lead</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentProjects.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell>{project.clientName}</TableCell>
                        <TableCell>
                          {project.teamLeadIds && project.teamLeadIds.length > 0
                            ? project.teamLeadIds
                                .map((tl) => tl.name)
                                .join(", ")
                            : "Unassigned"}
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
                          <Badge
                            variant="outline"
                            className={getStatusColor(project.status)}
                          >
                            {project.status?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(project.deadline).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {overview.pendingTasks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasks waiting to start
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {overview.inProgressTasks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently being worked on
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {overview.completedTasks}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully finished
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{overview.totalLeads}</div>
                <p className="text-xs text-muted-foreground">
                  All leads in pipeline
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Converted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {overview.wonLeads}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully won
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">
                  {overview.leadConversionRate}%
                </div>
                <Progress
                  value={overview.leadConversionRate}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
