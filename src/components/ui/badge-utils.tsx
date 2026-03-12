/**
 * Badge Utilities
 * Reusable badge components for consistent status and priority displays
 */

import { Badge } from "@/components/ui/badge";
import { CircleDot, AlertCircle, Clock, CheckCircle } from "lucide-react";

/**
 * Priority Badge Component
 */
export function PriorityBadge({ priority }: { priority: string }) {
  switch (priority.toLowerCase()) {
    case "high":
      return <Badge variant="destructive">High</Badge>;
    case "medium":
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          Medium
        </Badge>
      );
    case "low":
      return <Badge variant="outline">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

/**
 * Project Status Badge Component
 */
export function ProjectStatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          Active
        </Badge>
      );
    case "planning":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          Planning
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
          Completed
        </Badge>
      );
    case "on_hold":
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          On Hold
        </Badge>
      );
    default:
      return <Badge variant="outline">{status.replace("_", " ")}</Badge>;
  }
}

/**
 * Task Status Badge Component
 */
export function TaskStatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "in_progress":
    case "working":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <CircleDot className="h-3 w-3 mr-1" />
          {status === "working" ? "Working" : "In Progress"}
        </Badge>
      );
    case "under_review":
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      );
    case "on_hold":
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="h-3 w-3 mr-1" />
          On Hold
        </Badge>
      );
    case "not_started":
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          Not Started
        </Badge>
      );
    default:
      return <Badge variant="outline">{status.replace("_", " ")}</Badge>;
  }
}

/**
 * Intern Status Badge Component
 */
export function InternStatusBadge({
  status,
  note,
}: {
  status?: string;
  note?: string;
}) {
  if (!status) {
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
        Not Started
      </Badge>
    );
  }

  switch (status.toLowerCase()) {
    case "started":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <CircleDot className="h-3 w-3 mr-1" />
          Started
        </Badge>
      );
    case "issue":
      return (
        <Badge
          className="bg-red-100 text-red-800 border-red-200"
          title={note || ""}
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Issue
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

/**
 * Get status color class for projects
 */
export function getProjectStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200";
    case "planning":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "completed":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "on_hold":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200";
    case "medium":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "low":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}
