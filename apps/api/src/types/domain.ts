/**
 * Domain-specific types and utilities
 *
 * Reusable type definitions and type guards for business logic.
 */

import type { Prisma } from '@prisma/client';

/**
 * Commonly used Prisma transaction client type
 * Use this instead of repeating the full type everywhere
 */
export type TransactionClient = Prisma.TransactionClient;

/**
 * Type guard to check if a string is a valid invitation code format
 * Invitation codes are 8 uppercase alphanumeric characters (excluding 0O1I)
 */
export function isValidInvitationCode(code: string): boolean {
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code);
}

/**
 * Type guard to check if a value is a valid resort ID
 */
export function isValidResortId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
