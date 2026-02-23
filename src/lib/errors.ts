/**
 * Centralized Error Handler for API Routes
 * Provides consistent error responses and logging
 */

export class APIError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends APIError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends APIError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Centralized error response handler
 */
export function handleAPIError(error: unknown) {
  // Log the error details (in production, send to monitoring service)
  const timestamp = new Date().toISOString();

  if (error instanceof APIError) {
    console.error(`[${timestamp}] API Error:`, {
      message: error.message,
      statusCode: error.statusCode,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp,
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Handle Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    console.error(`[${timestamp}] Validation Error:`, error);
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: (error as any).issues,
        timestamp,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Handle unexpected errors
  console.error(`[${timestamp}] Unexpected Error:`, error);

  return new Response(
    JSON.stringify({
      error:
        process.env.NODE_ENV === "development"
          ? (error as Error).message
          : "Internal Server Error",
      timestamp,
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Logger utility for structured logging
 */
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || "");
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || "");
  },
  error: (message: string, error?: any) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || "",
    );
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        meta || "",
      );
    }
  },
};
