/**
 * Audit Trail Utilities
 * Helper functions to log user actions
 */

import AuditLog from "@/models/AuditLog";
import { Types } from "mongoose";

interface AuditParams {
  userId: string | Types.ObjectId;
  userName: string;
  userRole: "founder" | "teamlead" | "intern";
  action: string;
  entityType:
    | "user"
    | "project"
    | "task"
    | "lead"
    | "performance"
    | "research"
    | "brainstorm";
  entityId: string | Types.ObjectId;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  request?: Request;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditParams): Promise<void> {
  try {
    const ipAddress = params.request
      ? getIpFromRequest(params.request)
      : undefined;
    const userAgent = params.request?.headers.get("user-agent") || undefined;

    await AuditLog.create({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes,
      metadata: params.metadata,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    console.log(
      `[AUDIT] ${params.userName} (${params.userRole}) ${params.action} ${params.entityType} ${params.entityId}`,
    );
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error("[AUDIT] Failed to create audit log:", error);
  }
}

/**
 * Get IP address from request
 */
function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Pre-built audit log helpers for common actions
 */
export const audit = {
  /**
   * Log user creation
   */
  userCreated: async (params: {
    creatorId: string;
    creatorName: string;
    creatorRole: "founder" | "teamlead" | "intern";
    newUserId: string;
    newUserData: any;
    request?: Request;
  }) => {
    await createAuditLog({
      userId: params.creatorId,
      userName: params.creatorName,
      userRole: params.creatorRole,
      action: "created",
      entityType: "user",
      entityId: params.newUserId,
      metadata: {
        newUserEmail: params.newUserData.email,
        newUserRole: params.newUserData.role,
        newUserName: params.newUserData.name,
      },
      request: params.request,
    });
  },

  /**
   * Log user update
   */
  userUpdated: async (params: {
    updaterId: string;
    updaterName: string;
    updaterRole: "founder" | "teamlead" | "intern";
    userId: string;
    changes: Record<string, any>;
    request?: Request;
  }) => {
    await createAuditLog({
      userId: params.updaterId,
      userName: params.updaterName,
      userRole: params.updaterRole,
      action: "updated",
      entityType: "user",
      entityId: params.userId,
      changes: params.changes,
      request: params.request,
    });
  },

  /**
   * Log project creation
   */
  projectCreated: async (params: {
    creatorId: string;
    creatorName: string;
    creatorRole: "founder" | "teamlead" | "intern";
    projectId: string;
    projectData: any;
    request?: Request;
  }) => {
    await createAuditLog({
      userId: params.creatorId,
      userName: params.creatorName,
      userRole: params.creatorRole,
      action: "created",
      entityType: "project",
      entityId: params.projectId,
      metadata: {
        projectName: params.projectData.name,
        clientName: params.projectData.clientName,
        teamLeadIds: params.projectData.teamLeadIds,
      },
      request: params.request,
    });
  },

  /**
   * Log task assignment
   */
  taskAssigned: async (params: {
    assignerId: string;
    assignerName: string;
    assignerRole: "founder" | "teamlead" | "intern";
    taskId: string;
    taskTitle: string;
    assignedToId: string;
    assignedToName: string;
    request?: Request;
  }) => {
    await createAuditLog({
      userId: params.assignerId,
      userName: params.assignerName,
      userRole: params.assignerRole,
      action: "assigned",
      entityType: "task",
      entityId: params.taskId,
      metadata: {
        taskTitle: params.taskTitle,
        assignedToId: params.assignedToId,
        assignedToName: params.assignedToName,
      },
      request: params.request,
    });
  },

  /**
   * Log task status change
   */
  taskStatusChanged: async (params: {
    userId: string;
    userName: string;
    userRole: "founder" | "teamlead" | "intern";
    taskId: string;
    oldStatus: string;
    newStatus: string;
    request?: Request;
  }) => {
    await createAuditLog({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: "status_changed",
      entityType: "task",
      entityId: params.taskId,
      changes: {
        status: {
          from: params.oldStatus,
          to: params.newStatus,
        },
      },
      request: params.request,
    });
  },

  /**
   * Log performance review
   */
  performanceReviewed: async (params: {
    reviewerId: string;
    reviewerName: string;
    reviewerRole: "founder" | "teamlead" | "intern";
    performanceId: string;
    internId: string;
    period: string;
    score: number;
    request?: Request;
  }) => {
    await createAuditLog({
      userId: params.reviewerId,
      userName: params.reviewerName,
      userRole: params.reviewerRole,
      action: "reviewed",
      entityType: "performance",
      entityId: params.performanceId,
      metadata: {
        internId: params.internId,
        period: params.period,
        score: params.score,
      },
      request: params.request,
    });
  },

  /**
   * Log lead status change
   */
  leadStatusChanged: async (params: {
    userId: string;
    userName: string;
    userRole: "founder" | "teamlead" | "intern";
    leadId: string;
    oldStatus: string;
    newStatus: string;
    request?: Request;
  }) => {
    await createAuditLog({
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: "status_changed",
      entityType: "lead",
      entityId: params.leadId,
      changes: {
        status: {
          from: params.oldStatus,
          to: params.newStatus,
        },
      },
      request: params.request,
    });
  },
};

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLog(
  entityType: string,
  entityId: string,
  limit: number = 50,
) {
  return await AuditLog.find({ entityType, entityId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get user activity log
 */
export async function getUserActivityLog(userId: string, limit: number = 100) {
  return await AuditLog.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
}
