/**
 * Simple In-Memory Cache for API Responses
 * For production with multiple instances, use Redis
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.store = new Map();
    this.maxSize = maxSize;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // If cache is full, remove oldest entry
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate cache entries by prefix
   */
  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      entries: Array.from(this.store.keys()),
    };
  }
}

// Export singleton instance
export const cache = new Cache();

/**
 * Cache key generators for consistency
 */
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  usersList: (role?: string) =>
    role ? `users:list:${role}` : "users:list:all",
  project: (id: string) => `project:${id}`,
  projectsList: (teamLeadId?: string) =>
    teamLeadId ? `projects:list:${teamLeadId}` : "projects:list:all",
  task: (id: string) => `task:${id}`,
  tasksList: (userId?: string, scope?: string) =>
    `tasks:list:${userId || "all"}:${scope || "all"}`,
  performance: (internId: string, period?: string) =>
    period ? `performance:${internId}:${period}` : `performance:${internId}`,
  dashboardStats: (role: string, userId: string) =>
    `dashboard:${role}:${userId}`,
  leads: (assignedTo?: string) =>
    assignedTo ? `leads:${assignedTo}` : "leads:all",
};

/**
 * Helper to wrap async function with caching
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300,
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  cache.set(key, data, ttl);

  return data;
}
