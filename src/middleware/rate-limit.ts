import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { tooManyRequests } from '../utils/AppError';

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const cleanupExpired = (now: number) => {
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
};

export const createRateLimiter = (options: { windowMs?: number; max?: number; prefix: string }) => {
  const windowMs = options.windowMs ?? env.rateLimitWindowMs;
  const max = options.max ?? env.rateLimitMax;

  return (request: Request, _response: Response, next: NextFunction) => {
    if (process.env.RATE_LIMIT_DISABLED === 'true') {
      next();
      return;
    }

    const now = Date.now();
    if (store.size > 5000) {
      cleanupExpired(now);
    }

    const identity = request.ip || request.socket.remoteAddress || 'unknown';
    const key = `${options.prefix}:${identity}`;
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= max) {
      next(tooManyRequests('Too many requests, please try again later'));
      return;
    }

    existing.count += 1;
    next();
  };
};

export const authRateLimit = createRateLimiter({ prefix: 'auth', max: env.isDevelopment ? 100 : 10 });
export const paymentRateLimit = createRateLimiter({ prefix: 'payment', max: env.isDevelopment ? 100 : 20 });
export const writeRateLimit = createRateLimiter({ prefix: 'write', max: env.isDevelopment ? 120 : 30 });

/** @deprecated Use named limiters */
export const rateLimitPlaceholder = writeRateLimit;
