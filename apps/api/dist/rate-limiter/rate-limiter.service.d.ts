export declare class RateLimiterService {
    private readonly store;
    consume(key: string, limit: number, ttlMs: number): Promise<void>;
}
