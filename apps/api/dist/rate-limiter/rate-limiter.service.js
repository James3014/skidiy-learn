var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
let RateLimiterService = class RateLimiterService {
    constructor() {
        this.store = new Map();
    }
    async consume(key, limit, ttlMs) {
        const now = Date.now();
        const entry = this.store.get(key);
        if (!entry || entry.expiresAt <= now) {
            this.store.set(key, { count: 1, expiresAt: now + ttlMs });
            return;
        }
        if (entry.count >= limit) {
            throw new HttpException('RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS);
        }
        entry.count += 1;
    }
};
RateLimiterService = __decorate([
    Injectable()
], RateLimiterService);
export { RateLimiterService };
//# sourceMappingURL=rate-limiter.service.js.map