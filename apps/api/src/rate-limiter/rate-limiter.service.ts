/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface CounterEntry {
  count: number;
  expiresAt: number;
}

@Injectable()
export class RateLimiterService {
  private readonly store = new Map<string, CounterEntry>();

  async consume(key: string, limit: number, ttlMs: number): Promise<void> {
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
}
