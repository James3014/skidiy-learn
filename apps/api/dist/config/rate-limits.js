export const RATE_LIMITS = {
    SHARED_QUERY: {
        max: 30,
        windowMs: 60_000
    },
    INVITATION_VERIFY: {
        max: 10,
        windowMs: 60_000
    }
};
export function isRateLimitEnabled(limit) {
    return limit.max > 0;
}
//# sourceMappingURL=rate-limits.js.map