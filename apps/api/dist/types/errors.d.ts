export interface ErrorResponse {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export declare function isErrorResponse(error: unknown): error is ErrorResponse;
