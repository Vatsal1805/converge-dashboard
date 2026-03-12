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
  Calendar,
  User as UserIcon,
  Loader2,
  ArrowLeft,
  Trash2,
  Edit,
  Save,
  X,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileDisplay,
  type FileDocument,
} from "@/components/project/FileDisplay";
import { FileUploadSection } from "@/components/project/FileUploadSection";
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
  projectDocument?: FileDocument; // legacy single document
  projectDocuments?: FileDocument[]; // multiple documents
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
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [docUrlsToRemove, setDocUrlsToRemove] = useState<string[]>([]);

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
    setNewFiles([]);
    setFileError("");
    setDocUrlsToRemove([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setFileError("");
    try {
      // Build current docs list: prefer projectDocuments, fall back to projectDocument
      const currentDocs: FileDocument[] =
        (project?.projectDocuments?.length ?? 0) > 0
          ? project!.projectDocuments!
          : project?.projectDocument
            ? [project.projectDocument]
            : [];

      // Remove docs marked for deletion
      let finalDocs = currentDocs.filter(
        (doc) => !docUrlsToRemove.includes(doc.url),
      );

      // Upload new files in parallel
      if (newFiles.length > 0) {
        const uploaded = await Promise.all(
          newFiles.map(async (file) => {
            const form = new FormData();
            form.append("file", file);
            const uploadRes = await fetch("/api/projects/upload-document", {
              method: "POST",
              body: form,
            });
            if (!uploadRes.ok) {
              const err = await uploadRes.json();
              throw new Error(err.error || "Failed to upload file");
            }
            const uploadData = await uploadRes.json();
            return uploadData.file;
          }),
        );
        finalDocs = [...finalDocs, ...uploaded];
      }

      const updateData: any = {
        ...editedProject,
        projectDocuments: finalDocs,
      };

      // Clear legacy single-doc field if it was removed
      if (
        project?.projectDocument &&
        docUrlsToRemove.includes(project.projectDocument.url)
      ) {
        updateData.projectDocument = null;
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
          setNewFiles([]);
          setDocUrlsToRemove([]);
          setFileError("");
          // Redirect back to projects page
          router.push("/projects");
        }
      } else {
        const errorData = await res.json();
        setFileError(errorData.error || "Failed to save project");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setFileError(err.message || "Failed to save project");
      alert(err.message || "Failed to save project");
    } finally {
      setSaving(false);
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

      {/* Project Documents Section */}
      {((project.projectDocuments?.length ?? 0) > 0 ||
        !!project.projectDocument ||
        isEditing) && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {/* List existing documents with individual remove/restore */}
                {(() => {
                  const existingDocs =
                    (project.projectDocuments?.length ?? 0) > 0
                      ? project.projectDocuments!
                      : project.projectDocument
                        ? [project.projectDocument]
                        : [];
                  return existingDocs.length > 0 ? (
                    <div className="space-y-2">
                      {existingDocs.map((doc) => (
                        <div
                          key={doc.url}
                          className={`flex items-center gap-3 p-3 border rounded-lg ${
                            docUrlsToRemove.includes(doc.url)
                              ? "opacity-50 bg-red-50 border-red-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                docUrlsToRemove.includes(doc.url)
                                  ? "line-through text-slate-400"
                                  : "text-slate-900"
                              }`}
                            >
                              {doc.originalName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant={
                              docUrlsToRemove.includes(doc.url)
                                ? "outline"
                                : "destructive"
                            }
                            size="sm"
                            onClick={() =>
                              setDocUrlsToRemove((prev) =>
                                prev.includes(doc.url)
                                  ? prev.filter((u) => u !== doc.url)
                                  : [...prev, doc.url],
                              )
                            }
                          >
                            {docUrlsToRemove.includes(doc.url)
                              ? "Restore"
                              : "Remove"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Upload new files */}
                <FileUploadSection
                  multiple={true}
                  selectedFiles={newFiles}
                  onFilesSelect={setNewFiles}
                  error={fileError}
                  onErrorChange={setFileError}
                  disabled={saving}
                  label="Add More Documents"
                  helpText="PDF, DOC, DOCX, XLS, XLSX, TXT — Max 50MB each"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {((project.projectDocuments?.length ?? 0) > 0
                  ? project.projectDocuments!
                  : project.projectDocument
                    ? [project.projectDocument]
                    : []
                ).map((doc) => (
                  <FileDisplay key={doc.url} document={doc} />
                ))}
                <p className="text-xs text-slate-500 mt-1">
                  💡 These documents contain project specifications and
                  requirements. Team members can reference them while working on
                  tasks.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
