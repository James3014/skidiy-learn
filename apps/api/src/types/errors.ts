/**
 * Structured error response type for public-facing APIs
 *
 * Use this format for errors that:
 * - Are exposed to public/unauthenticated users
 * - Need to be handled programmatically by clients
 * - Require additional context beyond the message
 *
 * For simple internal errors, a plain string message is sufficient.
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Type guard to check if an error is a structured error response
 */
export function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as ErrorResponse).code === 'string' &&
    typeof (error as ErrorResponse).message === 'string'
  );
}
