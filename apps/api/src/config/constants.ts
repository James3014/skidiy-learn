/**
 * Application-wide constants
 *
 * Centralized location for magic numbers and configuration values.
 */

/**
 * Invitation code generation constants
 */
export const INVITATION = {
  /**
   * Length of generated invitation codes
   */
  CODE_LENGTH: 8,

  /**
   * Characters used for invitation code generation
   * Excludes confusing characters: 0, O, 1, I
   */
  CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',

  /**
   * Maximum retry attempts for code generation on collision
   */
  MAX_RETRIES: 5,

  /**
   * Default expiration period for invitations (in days)
   */
  DEFAULT_EXPIRY_DAYS: 7
} as const;

/**
 * Query pagination constants
 */
export const PAGINATION = {
  /**
   * Default limit for query results
   */
  DEFAULT_LIMIT: 20
} as const;
