// Minimal in-memory fixed-window rate limiter. Suitable for a single-instance
// hackathon deployment; swap for a shared store (Redis/Upstash) for multi-instance.
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000,
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now > rec.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  rec.count += 1;
  const ok = rec.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - rec.count),
    retryAfter: ok ? 0 : Math.ceil((rec.reset - now) / 1000),
  };
}
