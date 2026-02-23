/**
 * Notification System for ConvergeOS
 * Handles email notifications and in-app notifications
 */

import { Types } from "mongoose";
import Notification from "@/models/Notification";
import connectToDatabase from "./db";

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface InAppNotification {
  userId: Types.ObjectId;
  type:
    | "task_assigned"
    | "task_deadline"
    | "performance_review"
    | "project_update"
    | "comment"
    | "mention";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Email notification templates
 */
const emailTemplates = {
  taskAssigned: (data: {
    internName: string;
    taskTitle: string;
    deadline: string;
    projectName: string;
  }) => ({
    subject: `New Task Assigned: ${data.taskTitle}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Task Assigned</h2>
                <p>Hi ${data.internName},</p>
                <p>You have been assigned a new task:</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${data.taskTitle}</h3>
                    <p><strong>Project:</strong> ${data.projectName}</p>
                    <p><strong>Deadline:</strong> ${data.deadline}</p>
                </div>
                <p>Please log in to ConvergeOS to view the full task details.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-tasks" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                    View Task
                </a>
            </div>
        `,
    text: `Hi ${data.internName}, You have been assigned a new task: ${data.taskTitle} for project ${data.projectName}. Deadline: ${data.deadline}`,
  }),

  performanceReview: (data: {
    internName: string;
    period: string;
    score: number;
  }) => ({
    subject: `Performance Review - ${data.period}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Performance Review Available</h2>
                <p>Hi ${data.internName},</p>
                <p>Your performance review for ${data.period} is now available.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Overall Score:</strong> ${data.score}/100</p>
                </div>
                <p>Log in to view your detailed feedback and goals for next period.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-performance" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                    View Review
                </a>
            </div>
        `,
    text: `Hi ${data.internName}, Your performance review for ${data.period} is available. Score: ${data.score}/100`,
  }),

  taskDeadlineReminder: (data: {
    internName: string;
    taskTitle: string;
    hoursLeft: number;
  }) => ({
    subject: `Deadline Reminder: ${data.taskTitle}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Task Deadline Approaching</h2>
                <p>Hi ${data.internName},</p>
                <p>Reminder: Your task <strong>${data.taskTitle}</strong> is due in <strong>${data.hoursLeft} hours</strong>.</p>
                <p>Make sure to complete and submit it on time.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/my-tasks" 
                   style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                    View Task
                </a>
            </div>
        `,
    text: `Reminder: Task ${data.taskTitle} is due in ${data.hoursLeft} hours.`,
  }),

  projectAssigned: (data: {
    teamLeadName: string;
    projectName: string;
    clientName: string;
    deadline: string;
  }) => ({
    subject: `New Project Assignment: ${data.projectName}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">New Project Assigned</h2>
                <p>Hi ${data.teamLeadName},</p>
                <p>You have been assigned as Team Lead for a new project:</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${data.projectName}</h3>
                    <p><strong>Client:</strong> ${data.clientName}</p>
                    <p><strong>Deadline:</strong> ${data.deadline}</p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0;">
                    View Project
                </a>
            </div>
        `,
    text: `New Project: ${data.projectName} for ${data.clientName}. Deadline: ${data.deadline}`,
  }),
};

/**
 * Send email notification
 * In development, just log. In production, integrate with SMTP or email service
 */
export async function sendEmail(
  notification: EmailNotification,
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("📧 [EMAIL] Would send:", {
      to: notification.to,
      subject: notification.subject,
      text: notification.text,
    });
    return;
  }

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // Example with nodemailer:
  // const transporter = nodemailer.createTransporter({...});
  // await transporter.sendMail(notification);
}

/**
 * Notification helper functions
 */
export const notifications = {
  /**
   * Notify intern about new task assignment
   */
  async taskAssigned(params: {
    internEmail: string;
    internName: string;
    taskTitle: string;
    projectName: string;
    deadline: Date;
  }) {
    const template = emailTemplates.taskAssigned({
      internName: params.internName,
      taskTitle: params.taskTitle,
      projectName: params.projectName,
      deadline: params.deadline.toLocaleDateString(),
    });

    await sendEmail({
      to: params.internEmail,
      ...template,
    });
  },

  /**
   * Notify about performance review
   */
  async performanceReview(params: {
    internEmail: string;
    internName: string;
    period: string;
    score: number;
  }) {
    const template = emailTemplates.performanceReview(params);
    await sendEmail({
      to: params.internEmail,
      ...template,
    });
  },

  /**
   * Send task deadline reminder
   */
  async taskDeadline(params: {
    internEmail: string;
    internName: string;
    taskTitle: string;
    hoursLeft: number;
  }) {
    const template = emailTemplates.taskDeadlineReminder(params);
    await sendEmail({
      to: params.internEmail,
      ...template,
    });
  },

  /**
   * Notify team lead about project assignment
   */
  async projectAssigned(params: {
    teamLeadEmail: string;
    teamLeadName: string;
    projectName: string;
    clientName: string;
    deadline: Date;
  }) {
    const template = emailTemplates.projectAssigned({
      teamLeadName: params.teamLeadName,
      projectName: params.projectName,
      clientName: params.clientName,
      deadline: params.deadline.toLocaleDateString(),
    });

    await sendEmail({
      to: params.teamLeadEmail,
      ...template,
    });
  },
};

/**
 * Schedule deadline reminders
 * This should be run as a cron job or scheduled task
 */
export async function scheduleDeadlineReminders() {
  // TODO: Implement cron job to check tasks with deadlines in next 24 hours
  // and send reminder emails to interns
}

/**
 * =============================================================
 * IN-APP NOTIFICATION HELPERS
 * =============================================================
 */

interface CreateNotificationParams {
  userId: string | Types.ObjectId;
  type: "task" | "project" | "lead" | "brainstorm" | "performance" | "team";
  priority?: "critical" | "important" | "info";
  title: string;
  message: string;
  actionUrl?: string;
  relatedId?: string | Types.ObjectId;
  relatedModel?: string;
}

/**
 * Create a new in-app notification
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<void> {
  try {
    await connectToDatabase();

    await Notification.create({
      userId: new Types.ObjectId(params.userId.toString()),
      type: params.type,
      priority: params.priority || "info",
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      relatedId: params.relatedId
        ? new Types.ObjectId(params.relatedId.toString())
        : undefined,
      relatedModel: params.relatedModel,
      isRead: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: (string | Types.ObjectId)[],
  params: Omit<CreateNotificationParams, "userId">,
): Promise<void> {
  try {
    await connectToDatabase();

    const notifications = userIds.map((userId) => ({
      userId: new Types.ObjectId(userId.toString()),
      type: params.type,
      priority: params.priority || "info",
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      relatedId: params.relatedId
        ? new Types.ObjectId(params.relatedId.toString())
        : undefined,
      relatedModel: params.relatedModel,
      isRead: false,
      createdAt: new Date(),
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
  }
}

/**
 * Predefined notification templates for common events
 */
export const inAppNotifications = {
  /**
   * Task assigned to intern
   */
  taskAssigned: async (params: {
    userId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    taskTitle: string;
    projectName: string;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "task",
      priority: "important",
      title: "New Task Assigned",
      message: `You have been assigned: ${params.taskTitle} in ${params.projectName}`,
      actionUrl: "/my-tasks",
      relatedId: params.taskId,
      relatedModel: "Task",
    });
  },

  /**
   * Task status changed by team lead
   */
  taskUpdated: async (params: {
    userId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    taskTitle: string;
    newStatus: string;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "task",
      priority: "info",
      title: "Task Status Updated",
      message: `"${params.taskTitle}" status changed to ${params.newStatus}`,
      actionUrl: "/my-tasks",
      relatedId: params.taskId,
      relatedModel: "Task",
    });
  },

  /**
   * Task deadline approaching
   */
  taskDeadlineApproaching: async (params: {
    userId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    taskTitle: string;
    hoursLeft: number;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "task",
      priority: "critical",
      title: "Deadline Approaching",
      message: `"${params.taskTitle}" is due in ${params.hoursLeft} hours`,
      actionUrl: "/my-tasks",
      relatedId: params.taskId,
      relatedModel: "Task",
    });
  },

  /**
   * Task marked as emergency by intern
   */
  taskEmergency: async (params: {
    userId: string | Types.ObjectId;
    taskId: string | Types.ObjectId;
    taskTitle: string;
    internName: string;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "task",
      priority: "critical",
      title: "Emergency Status Flagged",
      message: `${params.internName} marked "${params.taskTitle}" as Emergency`,
      actionUrl: "/tasks",
      relatedId: params.taskId,
      relatedModel: "Task",
    });
  },

  /**
   * Project assigned to team lead
   */
  projectAssigned: async (params: {
    userId: string | Types.ObjectId;
    projectId: string | Types.ObjectId;
    projectName: string;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "project",
      priority: "important",
      title: "New Project Assignment",
      message: `You are now a team lead for "${params.projectName}"`,
      actionUrl: "/projects/" + params.projectId.toString(),
      relatedId: params.projectId,
      relatedModel: "Project",
    });
  },

  /**
   * Project status changed
   */
  projectStatusChanged: async (params: {
    userIds: (string | Types.ObjectId)[];
    projectId: string | Types.ObjectId;
    projectName: string;
    newStatus: string;
  }) => {
    await createBulkNotifications(params.userIds, {
      type: "project",
      priority: "info",
      title: "Project Status Updated",
      message: `"${params.projectName}" status changed to ${params.newStatus}`,
      actionUrl: "/projects/" + params.projectId.toString(),
      relatedId: params.projectId,
      relatedModel: "Project",
    });
  },

  /**
   * Comment on brainstorm post
   */
  brainstormComment: async (params: {
    userId: string | Types.ObjectId;
    postId: string | Types.ObjectId;
    commenterName: string;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "brainstorm",
      priority: "info",
      title: "New Comment",
      message: `${params.commenterName} commented on your brainstorm post`,
      actionUrl: "/brainstorm",
      relatedId: params.postId,
      relatedModel: "Brainstorm",
    });
  },

  /**
   * Performance score updated
   */
  performanceUpdated: async (params: {
    userId: string | Types.ObjectId;
    newScore: number;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "performance",
      priority: "important",
      title: "Performance Score Updated",
      message: `Your performance score is now ${params.newScore}`,
      actionUrl: "/my-performance",
    });
  },

  /**
   * Lead status changed to Won
   */
  leadWon: async (params: {
    userId: string | Types.ObjectId;
    leadId: string | Types.ObjectId;
    leadName: string;
    dealValue: number;
  }) => {
    await createNotification({
      userId: params.userId,
      type: "lead",
      priority: "important",
      title: "Lead Won! 🎉",
      message: `${params.leadName} - $${params.dealValue.toLocaleString()} deal closed`,
      actionUrl: "/leads",
      relatedId: params.leadId,
      relatedModel: "Lead",
    });
  },
};
