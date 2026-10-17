/**
 * Sliding-window rate limiter.
 *
 * createRateLimiter returns a function that closes over its own `hits` map, so
 * each limiter keeps independent state without any globals. State is per server
 * instance (fine for a single region / hobby deployment); swap the Map for Redis
 * or Upstash if you scale out to many instances.
 */
export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function check(key: string, now = Date.now()): RateLimitResult {
    const windowStart = now - windowMs;
    const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= limit) {
      hits.set(key, recent);
      return { ok: false, remaining: 0, retryAfterSec: Math.ceil((recent[0] + windowMs - now) / 1000) };
    }

    recent.push(now);
    hits.set(key, recent);

    // Keep memory bounded: occasionally drop keys whose window has fully expired.
    if (hits.size > 5000) {
      for (const [k, times] of hits) if (times[times.length - 1] <= windowStart) hits.delete(k);
    }

    return { ok: true, remaining: limit - recent.length, retryAfterSec: 0 };
  };
}
