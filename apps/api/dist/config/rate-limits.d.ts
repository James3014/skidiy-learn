export declare const RATE_LIMITS: {
    readonly SHARED_QUERY: {
        readonly max: 30;
        readonly windowMs: 60000;
    };
    readonly INVITATION_VERIFY: {
        readonly max: 10;
        readonly windowMs: 60000;
    };
};
export declare function isRateLimitEnabled(limit: typeof RATE_LIMITS[keyof typeof RATE_LIMITS]): boolean;
