export function isErrorResponse(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error &&
        typeof error.code === 'string' &&
        typeof error.message === 'string');
}
//# sourceMappingURL=errors.js.map