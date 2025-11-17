/**
 * Rate limiting configuration
 *
 * Centralized configuration for all rate limits in the application.
 * Set max to 0 to disable rate limiting for a specific operation.
 */
export const RATE_LIMITS = {
  /**
   * Shared records query rate limit
   * Prevents abuse when querying teaching records shared by other instructors
   */
  SHARED_QUERY: {
    max: 30,          // Maximum requests
    windowMs: 60_000  // Per minute
  },

  /**
   * Invitation verification rate limit
   * Prevents brute-force attacks on invitation codes
   */
  INVITATION_VERIFY: {
    max: 10,
    windowMs: 60_000
  }
} as const;

/**
 * Check if rate limiting is enabled for an operation
 */
export function isRateLimitEnabled(limit: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]): boolean {
  return limit.max > 0;
}
