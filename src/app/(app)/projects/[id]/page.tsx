"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  Calendar,
  User as UserIcon,
  Loader2,
  ArrowLeft,
  Clock,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  _id: string;
  name: string;
  clientName: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  teamLeadIds: { _id: string; name: string; email: string }[];
  budget?: number;
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedProject, setEditedProject] = useState<{
    description?: string;
    status?: string;
    priority?: string;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, userRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch("/api/auth/me"),
        ]);
        const projData = await projRes.json();
        const userData = await userRes.json();

        if (projData.project) setProject(projData.project);
        if (userData.user) setCurrentUser(userData.user);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this project? This will NOT delete associated tasks but they will lose their project reference.",
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/projects");
      } else {
        alert("Failed to delete project");
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (project) {
      setEditedProject({
        description: project.description,
        status: project.status,
        priority: project.priority,
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditedProject({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedProject),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setProject(data.project);
          setIsEditing(false);
          setEditedProject({});
          // Redirect back to projects page
          router.push("/projects");
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save project");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "planning":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Button
          asChild
          className="mt-4 text-black hover:text-black"
          variant="outline"
        >
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-black hover:text-black"
        >
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-black">
            {project.name}
          </h2>
          <p className="text-slate-600">{project.clientName}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {(currentUser?.role === "founder" || currentUser?.role === "teamlead") && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="text-black hover:text-black"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="text-black hover:text-black"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="text-black hover:text-black"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </>
          )}
          {currentUser?.role === "founder" && !isEditing && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-black hover:text-black"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Project
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Description</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedProject.description || ""}
                onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                placeholder="Enter project description..."
                rows={5}
                className="resize-none"
              />
            ) : (
              <p className="text-slate-800 leading-relaxed">
                {project.description || "No description provided."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Status
              </span>
              {isEditing ? (
                <Select
                  value={editedProject.status || project.status}
                  onValueChange={(value) => setEditedProject({ ...editedProject, status: value })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className={getStatusColor(project.status)}
                >
                  {project.status.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Priority
              </span>
              {isEditing ? (
                <Select
                  value={editedProject.priority || project.priority}
                  onValueChange={(value) => setEditedProject({ ...editedProject, priority: value })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="text-black border-slate-300">
                  {project.priority.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Deadline
              </span>
              <div className="flex items-center gap-1 text-sm text-black">
                <Calendar className="h-4 w-4 text-slate-500" />
                {new Date(project.deadline).toLocaleDateString()}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Team Leads
              </span>
              <div className="flex flex-wrap gap-2">
                {project.teamLeadIds && project.teamLeadIds.length > 0 ? (
                  project.teamLeadIds.map((lead) => (
                    <Badge
                      key={lead._id}
                      variant="outline"
                      className="text-black border-slate-300"
                    >
                      <UserIcon className="h-3 w-3 mr-1" />
                      {lead.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No team leads assigned
                  </span>
                )}
              </div>
            </div>
            {project.budget && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <span className="text-sm font-semibold text-slate-700">
                  Budget
                </span>
                <span className="text-sm font-bold text-black">
                  ${project.budget.toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
