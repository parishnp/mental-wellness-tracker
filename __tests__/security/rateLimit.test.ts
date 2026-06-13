import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/security/rateLimit";

describe("rateLimit", () => {
  it("allows up to the limit, then blocks with a retry-after", () => {
    const key = "test-key-1";
    expect(rateLimit(key, 3).ok).toBe(true);
    expect(rateLimit(key, 3).ok).toBe(true);
    expect(rateLimit(key, 3).ok).toBe(true);
    const blocked = rateLimit(key, 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    expect(rateLimit("test-key-2", 1).ok).toBe(true);
    expect(rateLimit("test-key-2", 1).ok).toBe(false);
    expect(rateLimit("test-key-3", 1).ok).toBe(true);
  });
});
