import { describe, expect, it } from "vitest";
import {
  clientIpFromRequest,
  PlacesRateLimiter,
  rateLimitHeaders,
} from "./rate-limit.js";

describe("PlacesRateLimiter", () => {
  it("allows burst then rejects with quota until refill", () => {
    const limiter = new PlacesRateLimiter({
      burst: 2,
      maxConcurrent: 10,
      refillPerMinute: 60,
    });
    const key = "10.0.0.1:places-expensive";
    const t0 = 1_000_000;

    const first = limiter.tryAcquire(key, t0);
    const second = limiter.tryAcquire(key, t0);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok) {
      first.release();
    }
    if (second.ok) {
      second.release();
    }

    const third = limiter.tryAcquire(key, t0);
    expect(third.ok).toBe(false);
    if (!third.ok) {
      expect(third.reason).toBe("quota");
      expect(third.snapshot.remaining).toBe(0);
      expect(third.snapshot.retryAfterSec).toBeGreaterThanOrEqual(1);
      expect(third.snapshot.limit).toBe(2);
    }

    // 60 tokens/min => 1 token/sec; after 1s one token is available.
    const afterRefill = limiter.tryAcquire(key, t0 + 1000);
    expect(afterRefill.ok).toBe(true);
    if (afterRefill.ok) {
      afterRefill.release();
    }
  });

  it("rejects when concurrent cap is exceeded without consuming quota forever", () => {
    const limiter = new PlacesRateLimiter({
      burst: 5,
      maxConcurrent: 2,
      refillPerMinute: 5,
    });
    const key = PlacesRateLimiter.placesExpensiveKey("192.0.2.10");
    const t0 = 2_000_000;

    const a = limiter.tryAcquire(key, t0);
    const b = limiter.tryAcquire(key, t0);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);

    const blocked = limiter.tryAcquire(key, t0);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe("concurrency");
      expect(blocked.snapshot.retryAfterSec).toBe(1);
    }

    if (a.ok) {
      a.release();
    }
    const afterRelease = limiter.tryAcquire(key, t0);
    expect(afterRelease.ok).toBe(true);
    if (b.ok) {
      b.release();
    }
    if (afterRelease.ok) {
      afterRelease.release();
    }
  });

  it("isolates keys so different IPs do not share quota", () => {
    const limiter = new PlacesRateLimiter({
      burst: 1,
      maxConcurrent: 5,
      refillPerMinute: 1,
    });
    const t0 = 3_000_000;
    const a = limiter.tryAcquire(
      PlacesRateLimiter.placesExpensiveKey("198.51.100.1"),
      t0,
    );
    const b = limiter.tryAcquire(
      PlacesRateLimiter.placesExpensiveKey("198.51.100.2"),
      t0,
    );
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (a.ok) {
      a.release();
    }
    if (b.ok) {
      b.release();
    }
  });

  it("idempotent release does not go negative", () => {
    const limiter = new PlacesRateLimiter({
      burst: 3,
      maxConcurrent: 1,
      refillPerMinute: 3,
    });
    const key = "10.0.0.2:places-expensive";
    const acquired = limiter.tryAcquire(key, 4_000_000);
    expect(acquired.ok).toBe(true);
    if (acquired.ok) {
      acquired.release();
      acquired.release();
    }
    const next = limiter.tryAcquire(key, 4_000_000);
    expect(next.ok).toBe(true);
    if (next.ok) {
      next.release();
    }
  });
});

describe("clientIpFromRequest", () => {
  it("strips IPv4-mapped IPv6 prefix", () => {
    const req = {
      socket: { remoteAddress: "::ffff:203.0.113.9" },
    } as Parameters<typeof clientIpFromRequest>[0];
    expect(clientIpFromRequest(req)).toBe("203.0.113.9");
  });

  it("falls back when remoteAddress is missing", () => {
    const req = {
      socket: { remoteAddress: undefined },
    } as Parameters<typeof clientIpFromRequest>[0];
    expect(clientIpFromRequest(req)).toBe("unknown");
  });
});

describe("rateLimitHeaders", () => {
  it("serializes snapshot fields", () => {
    expect(
      rateLimitHeaders({
        limit: 5,
        remaining: 2,
        resetSec: 12,
        retryAfterSec: 3,
      }),
    ).toEqual({
      "RateLimit-Limit": "5",
      "RateLimit-Remaining": "2",
      "RateLimit-Reset": "12",
      "Retry-After": "3",
    });
  });
});
