/**
 * Common validation schemas and utilities
 * Centralized to ensure consistency across API routes
 */

import { z } from "zod";
import { Types } from "mongoose";

/**
 * MongoDB ObjectId validator
 */
export const mongoIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
  });

/**
 * Email validator
 */
export const emailSchema = z.string().email().toLowerCase();

/**
 * Password validator
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long");

/**
 * Date string validator
 */
export const dateStringSchema = z.string().transform((str) => {
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return date;
});

/**
 * Pagination validator
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * Common field validators
 */
export const validators = {
  id: mongoIdSchema,
  email: emailSchema,
  password: passwordSchema,
  date: dateStringSchema,

  // String validators
  name: z.string().min(2).max(100),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),

  // Number validators
  positiveNumber: z.number().nonnegative(),
  score: z.number().min(0).max(100),
  rating: z.number().min(1).max(10),

  // Enum validators
  userRole: z.enum(["founder", "teamlead", "intern"]),
  userStatus: z.enum(["active", "inactive"]),
  taskStatus: z.enum([
    "not_started",
    "in_progress",
    "working",
    "on_hold",
    "under_review",
    "completed",
  ]),
  taskPriority: z.enum(["low", "medium", "high"]),
  projectStatus: z.enum(["planning", "active", "completed", "on_hold"]),
  leadStatus: z.enum([
    "new",
    "contacted",
    "qualified",
    "proposal",
    "won",
    "lost",
  ]),

  // File validators
  fileUrl: z.string().url(),
  fileType: z.string().max(50),
};

/**
 * User-related schemas
 */
export const userSchemas = {
  create: z.object({
    name: validators.name,
    email: validators.email,
    password: validators.password,
    role: validators.userRole,
    department: z.string().max(100).default("General"),
  }),

  update: z.object({
    name: validators.name.optional(),
    department: z.string().max(100).optional(),
    status: validators.userStatus.optional(),
  }),

  login: z.object({
    email: validators.email,
    password: z.string(), // Don't validate length on login
  }),
};

/**
 * Project-related schemas
 */
export const projectSchemas = {
  create: z.object({
    name: validators.title,
    clientName: validators.name,
    description: validators.description,
    teamLeadIds: z
      .array(validators.id)
      .min(1, "At least one team lead required"),
    members: z.array(validators.id).optional(),
    deadline: validators.date,
    priority: validators.taskPriority,
    budget: validators.positiveNumber.optional(),
  }),

  update: z.object({
    name: validators.title.optional(),
    clientName: validators.name.optional(),
    description: validators.description,
    teamLeadIds: z.array(validators.id).min(1).optional(),
    deadline: validators.date.optional(),
    status: validators.projectStatus.optional(),
    priority: validators.taskPriority.optional(),
    budget: validators.positiveNumber.optional(),
  }),
};

/**
 * Task-related schemas
 */
export const taskSchemas = {
  create: z.object({
    title: validators.title,
    description: validators.description,
    projectId: validators.id,
    assignedTo: validators.id,
    priority: validators.taskPriority,
    deadline: validators.date,
    estimatedHours: validators.positiveNumber,
  }),

  update: z.object({
    title: validators.title.optional(),
    description: validators.description,
    status: validators.taskStatus.optional(),
    priority: validators.taskPriority.optional(),
    deadline: validators.date.optional(),
    estimatedHours: validators.positiveNumber.optional(),
    hoursLogged: validators.positiveNumber.optional(),
    reviewNote: z.string().max(1000).optional(),
    internNote: z.string().max(1000).optional(),
  }),

  updateInternStatus: z.object({
    internStatus: z.enum([
      "not_started",
      "started",
      "issue",
      "emergency",
      "other",
    ]),
    internNote: z.string().max(500).optional(),
  }),
};

/**
 * Lead-related schemas
 */
export const leadSchemas = {
  create: z.object({
    name: validators.name,
    company: validators.name,
    email: validators.email,
    phone: z.string().max(20).optional(),
    source: z.string().max(100).default("Website"),
    dealValue: validators.positiveNumber,
    followUpDate: validators.date.optional(),
  }),

  update: z.object({
    name: validators.name.optional(),
    company: validators.name.optional(),
    email: validators.email.optional(),
    phone: z.string().max(20).optional(),
    status: validators.leadStatus.optional(),
    dealValue: validators.positiveNumber.optional(),
    assignedTo: validators.id.optional(),
    followUpDate: validators.date.optional(),
  }),
};

/**
 * Performance-related schemas
 */
export const performanceSchemas = {
  create: z.object({
    internId: validators.id,
    period: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Period must be in YYYY-MM format"),
    metrics: z.object({
      taskCompletion: validators.rating,
      quality: validators.rating,
      communication: validators.rating,
      punctuality: validators.rating,
      initiative: validators.rating,
    }),
    feedback: z.string().max(2000).default(""),
    goals: z.string().max(2000).default(""),
  }),
};

/**
 * Research-related schemas
 */
export const researchSchemas = {
  create: z.object({
    title: validators.title,
    description: validators.description,
    fileUrl: validators.fileUrl,
    fileType: validators.fileType,
    projectId: validators.id.optional(),
    tags: z.array(z.string().max(50)).max(10).default([]),
  }),

  review: z.object({
    status: z.enum(["approved", "rejected"]),
    reviewNotes: z.string().max(1000).optional(),
  }),
};

/**
 * Brainstorm-related schemas
 */
export const brainstormSchemas = {
  create: z.object({
    content: z.string().min(10).max(2000),
    tags: z.array(z.string().max(50)).max(10).default([]),
  }),

  comment: z.object({
    content: z.string().min(1).max(500),
  }),
};

/**
 * Helper to parse request body with schema
 */
export async function parseBody<T>(
  request: Request,
  schema: z.Schema<T>,
): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Helper to parse URL search params with schema
 */
export function parseSearchParams<T>(url: URL, schema: z.Schema<T>): T {
  const params = Object.fromEntries(url.searchParams.entries());
  return schema.parse(params);
}
