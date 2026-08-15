import { afterEach, describe, expect, it, vi } from "vitest";
import { PlacesRateLimiter } from "./http/rate-limit.js";
import {
  EMPTY_SEARCH_RESULT,
  mockServices,
  testConfig,
  withServer,
} from "./test/http-listener-harness.js";

const SEARCH_BODY = JSON.stringify({
  categoryId: "coffee-shops",
  city: "Seattle",
  countryCode: "us",
});

describe("createRequestListener rate limits", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 429 with RateLimit headers after burst is exhausted", async () => {
    const config = testConfig({
      rateLimit: {
        burst: 2,
        maxConcurrent: 10,
        refillPerMinute: 1,
      },
    });
    const services = mockServices();
    const limiter = new PlacesRateLimiter(config.rateLimit);

    await withServer(
      config,
      services,
      async (baseUrl) => {
        const ok1 = await fetch(`${baseUrl}/places/search`, {
          body: SEARCH_BODY,
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const ok2 = await fetch(`${baseUrl}/places/search`, {
          body: SEARCH_BODY,
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        expect(ok1.status).toBe(200);
        expect(ok2.status).toBe(200);

        const limited = await fetch(`${baseUrl}/places/search`, {
          body: SEARCH_BODY,
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        expect(limited.status).toBe(429);
        expect(limited.headers.get("Retry-After")).toBeTruthy();
        expect(limited.headers.get("RateLimit-Limit")).toBe("2");
        expect(limited.headers.get("RateLimit-Remaining")).toBe("0");
        const problem = (await limited.json()) as {
          status: number;
          type: string;
        };
        expect(problem.status).toBe(429);
        expect(problem.type).toContain("/rate-limited");
      },
      limiter,
    );
  });

  it("returns 503 when concurrent cap is exceeded", async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const config = testConfig({
      rateLimit: {
        burst: 10,
        maxConcurrent: 1,
        refillPerMinute: 10,
      },
    });
    const services = mockServices({
      search: async () => {
        await firstGate;
        return EMPTY_SEARCH_RESULT;
      },
    });
    const limiter = new PlacesRateLimiter(config.rateLimit);

    await withServer(
      config,
      services,
      async (baseUrl) => {
        const firstPromise = fetch(`${baseUrl}/places/search`, {
          body: SEARCH_BODY,
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        await vi.waitFor(() => {
          expect(services.placeSearch.search).toHaveBeenCalled();
        });

        const second = await fetch(`${baseUrl}/places/search`, {
          body: SEARCH_BODY,
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        expect(second.status).toBe(503);
        expect(second.headers.get("Retry-After")).toBeTruthy();
        const problem = (await second.json()) as { type: string };
        expect(problem.type).toContain("/service-unavailable");

        releaseFirst();
        expect((await firstPromise).status).toBe(200);
      },
      limiter,
    );
  });

  it("does not rate-limit health probes", async () => {
    const config = testConfig({
      rateLimit: {
        burst: 1,
        maxConcurrent: 1,
        refillPerMinute: 1,
      },
    });
    const services = mockServices();
    const limiter = new PlacesRateLimiter(config.rateLimit);

    await withServer(
      config,
      services,
      async (baseUrl) => {
        for (let i = 0; i < 5; i += 1) {
          const live = await fetch(`${baseUrl}/health/live`);
          const ready = await fetch(`${baseUrl}/health/ready`);
          expect(live.status).toBe(200);
          expect(ready.status).toBe(200);
        }
      },
      limiter,
    );
  });

  it("returns an explicit limited ops signal on ready without probing upstream", async () => {
    const config = testConfig();
    const services = mockServices();
    const limiter = new PlacesRateLimiter(config.rateLimit);

    await withServer(
      config,
      services,
      async (baseUrl) => {
        const ready = await fetch(`${baseUrl}/health/ready`);
        expect(ready.status).toBe(200);
        await expect(ready.json()).resolves.toEqual({
          checks: {
            process: "ok",
            upstream: "not_probed",
          },
          status: "ready",
        });
      },
      limiter,
    );
  });

  it("tracks separate quotas per remote address via limiter keys", () => {
    const limiter = new PlacesRateLimiter({
      burst: 1,
      maxConcurrent: 5,
      refillPerMinute: 1,
    });
    const t0 = 5_000_000;
    const firstIp = PlacesRateLimiter.placesExpensiveKey("198.51.100.1");
    const secondIp = PlacesRateLimiter.placesExpensiveKey("198.51.100.2");

    const a = limiter.tryAcquire(firstIp, t0);
    expect(a.ok).toBe(true);
    if (a.ok) {
      a.release();
    }
    expect(limiter.tryAcquire(firstIp, t0).ok).toBe(false);

    const b = limiter.tryAcquire(secondIp, t0);
    expect(b.ok).toBe(true);
    if (b.ok) {
      b.release();
    }
  });
});
