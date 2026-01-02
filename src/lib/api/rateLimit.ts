/**
 * Rate limiting with Redis (Upstash) or in-memory fallback
 */

import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  max: number;
  windowMs: number;
  prefix?: string;
}

export const AI_RATE_LIMIT: RateLimitConfig = {
  max: 10,
  windowMs: 60 * 60 * 1000,
  prefix: 'ai',
};

export const API_RATE_LIMIT: RateLimitConfig = {
  max: 100,
  windowMs: 60 * 1000,
  prefix: 'api',
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();
const MAX_MEMORY_ENTRIES = 10000;

function cleanupMemoryStore(): void {
  const now = Date.now();
  if (memoryStore.size > MAX_MEMORY_ENTRIES) {
    for (const [key, value] of memoryStore.entries()) {
      if (now > value.resetTime) {
        memoryStore.delete(key);
      }
    }
  }
}

function checkMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${config.prefix || 'rl'}:${identifier}`;
  
  cleanupMemoryStore();
  
  const existing = memoryStore.get(key);
  
  if (!existing || now > existing.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetIn: config.windowMs,
    };
  }
  
  if (existing.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: existing.resetTime - now,
    };
  }
  
  existing.count++;
  return {
    allowed: true,
    remaining: config.max - existing.count,
    resetIn: existing.resetTime - now,
  };
}

async function checkRedisRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    return checkMemoryRateLimit(identifier, config);
  }
  
  const key = `ratelimit:${config.prefix || 'rl'}:${identifier}`;
  const windowSeconds = Math.ceil(config.windowMs / 1000);
  
  try {
    const incrResponse = await fetch(`${url}/incr/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!incrResponse.ok) {
      throw new Error(`Redis INCR failed: ${incrResponse.status}`);
    }
    
    const incrData = await incrResponse.json();
    const count = incrData.result as number;
    
    if (count === 1) {
      await fetch(`${url}/expire/${key}/${windowSeconds}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    
    const ttlResponse = await fetch(`${url}/ttl/${key}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const ttlData = await ttlResponse.json();
    const ttl = (ttlData.result as number) || windowSeconds;
    const resetIn = ttl * 1000;
    
    if (count > config.max) {
      return { allowed: false, remaining: 0, resetIn };
    }
    
    return {
      allowed: true,
      remaining: config.max - count,
      resetIn,
    };
  } catch (error) {
    console.error('[RateLimit] Redis error, falling back to memory:', error);
    return checkMemoryRateLimit(identifier, config);
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = AI_RATE_LIMIT
): Promise<RateLimitResult> {
  const hasRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (hasRedis) {
    return checkRedisRateLimit(identifier, config);
  }
  
  return checkMemoryRateLimit(identifier, config);
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const resetMinutes = Math.ceil(result.resetIn / 60000);
  
  return NextResponse.json(
    {
      error: `Rate limit exceeded. Try again in ${resetMinutes} minute${resetMinutes > 1 ? 's' : ''}.`,
      retryAfter: Math.ceil(result.resetIn / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
        'Retry-After': String(Math.ceil(result.resetIn / 1000)),
      },
    }
  );
}

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  config: RateLimitConfig
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(config.max));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetIn / 1000)));
  return response;
}
