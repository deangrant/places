import type { IncomingMessage } from "node:http";

/**
 * Token-bucket and concurrency settings for expensive Places routes.
 */
export interface PlacesRateLimitConfig {
  /** Maximum tokens (burst size). */
  burst: number;
  /** Maximum in-flight expensive requests per key. */
  maxConcurrent: number;
  /** Tokens added per minute (sustained rate). */
  refillPerMinute: number;
}

/**
 * Rate-limit header values derived from bucket state.
 */
export interface RateLimitSnapshot {
  /** Configured burst / limit. */
  limit: number;
  /** Whole tokens remaining after this decision. */
  remaining: number;
  /** Seconds until the bucket is next useful (or full when remaining is 0). */
  resetSec: number;
  /** Suggested client wait before retrying. */
  retryAfterSec: number;
}

/**
 * Why an acquire failed.
 */
export type RateLimitRejectReason = "concurrency" | "quota";

/**
 * Result of trying to start one expensive request.
 */
export type RateLimitAcquireResult =
  | {
      ok: true;
      /** Call when the request finishes (success or failure). */
      release: () => void;
      snapshot: RateLimitSnapshot;
    }
  | {
      ok: false;
      reason: RateLimitRejectReason;
      snapshot: RateLimitSnapshot;
    };

interface BucketState {
  concurrent: number;
  lastActivityMs: number;
  lastRefillMs: number;
  tokens: number;
}

const IDLE_PRUNE_MS = 10 * 60 * 1000;
const ROUTE_CLASS = "places-expensive";

/**
 * In-memory per-key token bucket with a concurrency cap.
 *
 * Suitable for a single Node process. Multi-instance fleets need a shared
 * store or edge limits.
 */
export class PlacesRateLimiter {
  private readonly buckets = new Map<string, BucketState>();
  private readonly burst: number;
  private readonly maxConcurrent: number;
  private readonly refillPerMs: number;

  /**
   * @param config Burst, refill, and concurrency settings.
   */
  constructor(config: PlacesRateLimitConfig) {
    this.burst = config.burst;
    this.maxConcurrent = config.maxConcurrent;
    this.refillPerMs = config.refillPerMinute / 60_000;
  }

  /**
   * Tries to consume one token and take a concurrency slot for `key`.
   * @param key Limit key (typically IP + route class).
   * @param nowMs Clock for tests (defaults to `Date.now()`).
   */
  tryAcquire(key: string, nowMs: number = Date.now()): RateLimitAcquireResult {
    this.pruneIdle(nowMs);
    const state = this.getOrCreate(key, nowMs);
    this.refill(state, nowMs);

    if (state.concurrent >= this.maxConcurrent) {
      state.lastActivityMs = nowMs;
      return {
        ok: false,
        reason: "concurrency",
        snapshot: this.snapshot(state, true),
      };
    }

    if (state.tokens < 1) {
      state.lastActivityMs = nowMs;
      return {
        ok: false,
        reason: "quota",
        snapshot: this.snapshot(state, false),
      };
    }

    state.tokens -= 1;
    state.concurrent += 1;
    state.lastActivityMs = nowMs;
    let released = false;
    return {
      ok: true,
      release: () => {
        if (released) {
          return;
        }
        released = true;
        state.concurrent = Math.max(0, state.concurrent - 1);
        state.lastActivityMs = Date.now();
      },
      snapshot: this.snapshot(state, false),
    };
  }

  /**
   * Builds the standard limit key for expensive Places POSTs.
   * @param clientIp Normalized client IP.
   */
  static placesExpensiveKey(clientIp: string): string {
    return `${clientIp}:${ROUTE_CLASS}`;
  }

  private getOrCreate(key: string, nowMs: number): BucketState {
    let state = this.buckets.get(key);
    if (!state) {
      state = {
        concurrent: 0,
        lastActivityMs: nowMs,
        lastRefillMs: nowMs,
        tokens: this.burst,
      };
      this.buckets.set(key, state);
    }
    return state;
  }

  private refill(state: BucketState, nowMs: number): void {
    const elapsed = Math.max(0, nowMs - state.lastRefillMs);
    if (elapsed === 0 || this.refillPerMs <= 0) {
      state.lastRefillMs = nowMs;
      return;
    }
    state.tokens = Math.min(
      this.burst,
      state.tokens + elapsed * this.refillPerMs,
    );
    state.lastRefillMs = nowMs;
  }

  private snapshot(
    state: BucketState,
    forConcurrency: boolean,
  ): RateLimitSnapshot {
    const remaining = Math.floor(state.tokens);
    const tokensNeeded = forConcurrency ? 0 : Math.max(0, 1 - state.tokens);
    const msToNextToken =
      this.refillPerMs > 0 ? Math.ceil(tokensNeeded / this.refillPerMs) : 0;
    const msToFull =
      this.refillPerMs > 0
        ? Math.ceil(Math.max(0, this.burst - state.tokens) / this.refillPerMs)
        : 0;

    const retryAfterSec = forConcurrency
      ? 1
      : Math.max(1, Math.ceil(msToNextToken / 1000));
    const resetSec = forConcurrency
      ? retryAfterSec
      : Math.max(retryAfterSec, Math.ceil(msToFull / 1000));

    return {
      limit: this.burst,
      remaining: Math.max(0, remaining),
      resetSec,
      retryAfterSec,
    };
  }

  private pruneIdle(nowMs: number): void {
    for (const [key, state] of this.buckets) {
      if (state.concurrent > 0) {
        continue;
      }
      if (nowMs - state.lastActivityMs >= IDLE_PRUNE_MS) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * Reads the peer IP from the socket. Does not trust forwarded headers.
 * @param req Incoming HTTP request.
 */
export function clientIpFromRequest(req: IncomingMessage): string {
  const raw = req.socket.remoteAddress ?? "unknown";
  if (raw.startsWith("::ffff:")) {
    return raw.slice("::ffff:".length);
  }
  return raw;
}

/**
 * Builds RateLimit-* and Retry-After header values from a snapshot.
 * @param snapshot Bucket snapshot after the decision.
 */
export function rateLimitHeaders(
  snapshot: RateLimitSnapshot,
): Record<string, string> {
  return {
    "RateLimit-Limit": String(snapshot.limit),
    "RateLimit-Remaining": String(snapshot.remaining),
    "RateLimit-Reset": String(snapshot.resetSec),
    "Retry-After": String(snapshot.retryAfterSec),
  };
}
