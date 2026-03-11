"use client";

import { useState, useEffect } from "react";
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
  Briefcase,
  Calendar,
  User as UserIcon,
  Loader2,
  Eye,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSession } from "@/components/auth/SessionProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Project {
  _id: string;
  name: string;
  clientName: string;
  description?: string;
  status: "planning" | "active" | "completed" | "on_hold";
  priority: "low" | "medium" | "high";
  deadline: string;
  teamLeadIds: Array<{ _id: string; name: string; email: string }>;
  members?: Array<{ _id: string; name: string; email: string }>;
  budget?: number;
}

const statusColors = {
  planning: "bg-blue-100 text-blue-700 border-blue-200",
  active: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  on_hold: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const priorityColors = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

export default function MyProjectsPage() {
  const { user: currentUser, loading: sessionLoading } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!sessionLoading && currentUser) {
      fetchMyProjects();
    }
  }, [sessionLoading, currentUser]);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects/my-projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Projects</h1>
          <p className="text-slate-600 mt-1">
            Projects you're assigned to as a team member
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </div>
        </div>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            My Assigned Projects ({filteredProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">
                {searchQuery
                  ? "No projects found matching your search"
                  : "You're not assigned to any projects yet"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {!searchQuery &&
                  "Your team lead will assign you to projects once available"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Team Lead</TableHead>
                    <TableHead>Team Members</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell>{project.clientName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[project.status]}
                        >
                          {project.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={priorityColors[project.priority]}
                        >
                          {project.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {Array.isArray(project.teamLeadIds) &&
                            project.teamLeadIds.length > 0
                              ? project.teamLeadIds
                                  .map((tl) =>
                                    typeof tl === "object" ? tl.name : tl,
                                  )
                                  .join(", ")
                              : "Not assigned"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.members && project.members.length > 0 ? (
                          <TooltipProvider>
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {project.members.slice(0, 3).map((member) => (
                                  <Tooltip key={member._id}>
                                    <TooltipTrigger>
                                      <Avatar className="h-8 w-8 border-2 border-white">
                                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                                          {member.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">
                                        {member.name}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {member.email}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                              {project.members.length > 3 && (
                                <span className="text-xs text-slate-500">
                                  +{project.members.length - 3} more
                                </span>
                              )}
                            </div>
                          </TooltipProvider>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Users className="h-4 w-4" />
                            <span>No members yet</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {new Date(project.deadline).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/projects/${project._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
