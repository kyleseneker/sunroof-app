import { describe, it, expect, beforeEach, vi } from 'vitest';

// Recreate the rate limiter logic for testing
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: userLimit.resetTime - now 
    };
  }
  
  userLimit.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - userLimit.count, 
    resetIn: userLimit.resetTime - now 
  };
}

describe('Rate Limiter', () => {
  beforeEach(() => {
    rateLimitMap.clear();
    vi.useFakeTimers();
  });

  it('allows first request from a user', () => {
    const result = checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('tracks request count correctly', () => {
    checkRateLimit('user-1'); // 1st
    checkRateLimit('user-1'); // 2nd
    const result = checkRateLimit('user-1'); // 3rd
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });

  it('blocks user after exceeding limit', () => {
    const userId = 'user-spam';
    
    // Make 10 requests (the limit)
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(userId);
    }
    
    // 11th request should be blocked
    const result = checkRateLimit(userId);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after time window expires', () => {
    const userId = 'user-reset';
    
    // Exhaust the limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit(userId);
    }
    
    expect(checkRateLimit(userId).allowed).toBe(false);
    
    // Fast-forward past the window
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW + 1000);
    
    // Should be allowed again
    const result = checkRateLimit(userId);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('tracks users independently', () => {
    // Exhaust user-1's limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-1');
    }
    
    // user-1 should be blocked
    expect(checkRateLimit('user-1').allowed).toBe(false);
    
    // user-2 should still be allowed
    expect(checkRateLimit('user-2').allowed).toBe(true);
  });
});

