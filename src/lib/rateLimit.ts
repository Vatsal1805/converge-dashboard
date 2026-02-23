/**
 * In-Memory Rate Limiter for API Routes
 * For production, use Redis-based rate limiting
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  },
  5 * 60 * 1000,
);

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
  message?: string;
}

/**
 * Rate limiter middleware
 * Usage: const limited = await rateLimit(request, { maxRequests: 10, windowMs: 60000 });
 */
export async function rateLimit(
  request: Request,
  options: RateLimitOptions = {},
): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  const windowMs =
    options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 15 min
  const maxRequests =
    options.maxRequests ||
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");

  // Get identifier (IP or user ID from token)
  const identifier = getIdentifier(request);

  const now = Date.now();
  const resetTime = now + windowMs;

  if (!store[identifier] || store[identifier].resetTime < now) {
    // Create new entry
    store[identifier] = {
      count: 1,
      resetTime,
    };
    return { limited: false, remaining: maxRequests - 1, resetTime };
  }

  // Increment count
  store[identifier].count++;

  if (store[identifier].count > maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetTime: store[identifier].resetTime,
    };
  }

  return {
    limited: false,
    remaining: maxRequests - store[identifier].count,
    resetTime: store[identifier].resetTime,
  };
}

/**
 * Get unique identifier for rate limiting
 * Priority: User ID > IP Address
 */
function getIdentifier(request: Request): string {
  // Try to get user from auth token
  const authHeader = request.headers.get("cookie");
  if (authHeader) {
    // Extract user ID from token if possible (simplified, enhance with actual JWT decode)
    const match = authHeader.match(/auth_token=([^;]+)/);
    if (match) {
      return `user:${match[1].substring(0, 20)}`; // Use token prefix as ID
    }
  }

  // Fallback to IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : request.headers.get("x-real-ip") || "unknown";

  return `ip:${ip}`;
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Reset": new Date(resetTime).toISOString(),
      },
    },
  );
}
