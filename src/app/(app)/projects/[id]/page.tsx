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
  FileText,
  Upload,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileDisplay,
  type FileDocument,
} from "@/components/project/FileDisplay";
import { FileUploadSection } from "@/components/project/FileUploadSection";
import { uploadFile } from "@/lib/fileUtils";
import { ProjectStatusBadge, PriorityBadge } from "@/components/ui/badge-utils";

interface Project {
  _id: string;
  name: string;
  clientName: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  teamLeadIds: { _id: string; name: string; email: string }[];
  members?: { _id: string; name: string; email: string; department?: string }[];
  budget?: number;
  projectDocument?: FileDocument;
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

  // File upload states for editing
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [removeExistingFile, setRemoveExistingFile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, userRes] = await Promise.all([
          fetch(`/api/projects/${id}`),
          fetch("/api/auth/me"),
        ]);
        const projData = await projRes.json();
        const userData = await userRes.json();

        if (projData.project) {
          setProject(projData.project);
        }
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
    setSelectedFile(null);
    setFileError("");
    setRemoveExistingFile(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setFileError("");
    try {
      let projectDocumentData = project?.projectDocument;

      // If user wants to remove existing file
      if (removeExistingFile) {
        projectDocumentData = undefined;
      }

      // If user selected a new file, upload it
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/projects/upload-document", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json();
          throw new Error(uploadError.error || "Failed to upload file");
        }

        const uploadData = await uploadRes.json();
        projectDocumentData = uploadData.file;
      }

      // Update project with edited data and new/removed document
      const updateData: any = { ...editedProject };
      if (removeExistingFile) {
        updateData.projectDocument = null;
      } else if (projectDocumentData) {
        updateData.projectDocument = projectDocumentData;
      }

      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          setProject(data.project);
          setIsEditing(false);
          setEditedProject({});
          setSelectedFile(null);
          setRemoveExistingFile(false);
          setFileError("");
          // Redirect back to projects page
          router.push("/projects");
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save project");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setFileError(err.message || "Failed to save project");
      alert(err.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  // File selection handler
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setFileError("");
    if (file) {
      setRemoveExistingFile(false);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-8 px-4">
      <div className="flex items-center gap-4 sticky top-0 bg-background z-10 py-4 -mx-4 px-4">
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
          {currentUser?.role === "founder" && !isEditing && (
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

      <div className={isEditing ? "space-y-6" : "grid gap-6 md:grid-cols-3"}>
        <Card
          className={
            isEditing
              ? "border-slate-200 shadow-sm"
              : "md:col-span-2 border-slate-200 shadow-sm"
          }
        >
          <CardHeader>
            <CardTitle className="text-black">Description</CardTitle>
          </CardHeader>
          <CardContent
            className={isEditing ? "" : "max-h-[400px] overflow-y-auto"}
          >
            {isEditing ? (
              <Textarea
                value={editedProject.description || ""}
                onChange={(e) =>
                  setEditedProject({
                    ...editedProject,
                    description: e.target.value,
                  })
                }
                placeholder="Enter project description..."
                rows={6}
                className="resize-none"
              />
            ) : (
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                {project.description || "No description provided."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black">Project Details</CardTitle>
          </CardHeader>
          <CardContent
            className={
              isEditing
                ? "space-y-4"
                : "space-y-4 max-h-[600px] overflow-y-auto"
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Status
              </span>
              {isEditing ? (
                <Select
                  value={editedProject.status || project.status}
                  onValueChange={(value) =>
                    setEditedProject({ ...editedProject, status: value })
                  }
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
                <ProjectStatusBadge status={project.status} />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Priority
              </span>
              {isEditing ? (
                <Select
                  value={editedProject.priority || project.priority}
                  onValueChange={(value) =>
                    setEditedProject({ ...editedProject, priority: value })
                  }
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
                <PriorityBadge priority={project.priority} />
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
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">
                Team Members
              </span>
              <div className="flex flex-wrap gap-2">
                {project.members && project.members.length > 0 ? (
                  project.members.map((member) => (
                    <Badge
                      key={member._id}
                      variant="outline"
                      className="text-blue-700 bg-blue-50 border-blue-200"
                    >
                      <UserIcon className="h-3 w-3 mr-1" />
                      {member.name}
                      {member.department && (
                        <span className="text-xs text-blue-500 ml-1">
                          ({member.department})
                        </span>
                      )}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No team members assigned yet
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

      {/* Project Document Section */}
      {(project.projectDocument || isEditing) && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {/* Show existing file if present and not marked for removal */}
                {project.projectDocument &&
                  !removeExistingFile &&
                  !selectedFile && (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {project.projectDocument.originalName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(
                              project.projectDocument.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRemoveExistingFile(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  )}

                {/* Show newly selected file */}
                {selectedFile && (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          {" • "}New file ready to upload
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Upload new file button */}
                {!selectedFile && (
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <Upload className="h-5 w-5 text-slate-500" />
                        <span className="text-sm text-slate-600">
                          {removeExistingFile || !project.projectDocument
                            ? "Click to upload document"
                            : "Click to replace document"}
                        </span>
                      </div>
                    </label>
                    <p className="text-xs text-slate-500 text-center">
                      PDF, DOC, DOCX, XLS, XLSX, TXT (Max 50MB)
                    </p>
                  </div>
                )}

                {fileError && (
                  <p className="text-sm text-red-600">{fileError}</p>
                )}
              </div>
            ) : (
              project.projectDocument && (
                <>
                  <FileDisplay document={project.projectDocument} />
                  <p className="text-xs text-slate-500 mt-3">
                    💡 This document contains project specifications and
                    requirements. Team members can reference it while working on
                    tasks.
                  </p>
                </>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
