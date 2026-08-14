import { afterEach, describe, expect, it, vi } from "vitest";
import { OVERPASS_TIMEOUT_SECONDS } from "@/constants/api.constants";
import { mergeOverpassAttempt } from "@/pages/Places/utils/merge-overpass-attempt";
import {
  hostnameFromEndpoint,
  isRetryableOverpassFailure,
  type OverpassAttemptEvent,
  OverpassError,
  OverpassHttpClient,
  overpassTimeoutMessage,
  shuffleEndpoints,
} from "@/services/overpass/overpass-http-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Keeps constructor order so failover tests stay deterministic. */
const identityOrder = (endpoints: readonly string[]): string[] => [
  ...endpoints,
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

describe("OverpassHttpClient query timeout", () => {
  it("throws OverpassError when the client timeout elapses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => {
                reject(
                  new DOMException("The operation was aborted.", "AbortError"),
                );
              },
              { once: true },
            );
          }),
      ),
    );

    const client = new OverpassHttpClient(
      ["https://example.test/interpreter"],
      25,
      identityOrder,
    );
    await expect(client.query("[out:json];out;")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OverpassError &&
        error.timedOut &&
        error.message === overpassTimeoutMessage(),
    );
  });

  it("rethrows when the caller signal aborts instead of rewriting as timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => {
                reject(
                  new DOMException("The operation was aborted.", "AbortError"),
                );
              },
              { once: true },
            );
          }),
      ),
    );

    const controller = new AbortController();
    const client = new OverpassHttpClient(
      ["https://example.test/interpreter"],
      OVERPASS_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );
    const pending = client.query("[out:json];out;", controller.signal);
    controller.abort();

    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof DOMException && error.name === "AbortError",
    );
  });
});

describe("OverpassHttpClient failover", () => {
  it("tries the next endpoint after HTTP 429 and reports attempts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ elements: [{ id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const attempts: OverpassAttemptEvent[] = [];
    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      OVERPASS_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );

    const result = await client.query("[out:json];out;", undefined, (event) => {
      attempts.push(event);
    });

    expect(result.elements).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://first.example/api/interpreter",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://second.example/api/interpreter",
    );
    expect(attempts.map((entry) => entry.status)).toEqual([
      "started",
      "failed",
      "started",
      "succeeded",
    ]);
    expect(attempts[0]?.hostname).toBe("first.example");
    expect(attempts[2]?.hostname).toBe("second.example");
  });

  it("respects an injected shuffle order when choosing the first endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ elements: [{ id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      OVERPASS_TIMEOUT_SECONDS * 1000,
      (endpoints) => [...endpoints].reverse(),
    );

    await client.query("[out:json];out;");

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://second.example/api/interpreter",
    );
  });

  it("does not try further endpoints after a non-retryable 400", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("bad", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      OVERPASS_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );

    await expect(client.query("[out:json];out;")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OverpassError && error.status === 400,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not try further endpoints after client timeout", async () => {
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              reject(
                new DOMException("The operation was aborted.", "AbortError"),
              );
            },
            { once: true },
          );
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const attempts: OverpassAttemptEvent[] = [];
    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      20,
      identityOrder,
    );

    await expect(
      client.query("[out:json];out;", undefined, (event) => {
        attempts.push(event);
      }),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof OverpassError && error.timedOut,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(attempts.map((entry) => entry.status)).toEqual([
      "started",
      "timed_out",
    ]);
  });

  it("throws the last error when every endpoint is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      OVERPASS_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );

    await expect(client.query("[out:json];out;")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OverpassError &&
        error.message.includes("Could not reach"),
    );
  });

  it("does not continue after caller abort on the first attempt", async () => {
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              reject(
                new DOMException("The operation was aborted.", "AbortError"),
              );
            },
            { once: true },
          );
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();
    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      OVERPASS_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );
    const pending = client.query("[out:json];out;", controller.signal);
    controller.abort();

    await expect(pending).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof DOMException && error.name === "AbortError",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("overpass helpers", () => {
  it("includes the configured Overpass timeout seconds", () => {
    expect(overpassTimeoutMessage()).toContain(
      String(OVERPASS_TIMEOUT_SECONDS),
    );
  });

  it("extracts hostnames from interpreter URLs", () => {
    expect(
      hostnameFromEndpoint("https://overpass.private.coffee/api/interpreter"),
    ).toBe("overpass.private.coffee");
  });

  it("treats 429 and 5xx as retryable and 400 as not", () => {
    expect(
      isRetryableOverpassFailure(new OverpassError("limited", { status: 429 })),
    ).toBe(true);
    expect(
      isRetryableOverpassFailure(new OverpassError("boom", { status: 503 })),
    ).toBe(true);
    expect(
      isRetryableOverpassFailure(new OverpassError("bad", { status: 400 })),
    ).toBe(false);
    expect(
      isRetryableOverpassFailure(
        new OverpassError("timeout", { timedOut: true }),
      ),
    ).toBe(false);
  });

  it("merges attempt events by index", () => {
    const started: OverpassAttemptEvent = {
      endpoint: "https://a.example/api/interpreter",
      hostname: "a.example",
      index: 0,
      status: "started",
    };
    const failed: OverpassAttemptEvent = {
      ...started,
      status: "failed",
    };
    expect(mergeOverpassAttempt([started], failed)).toEqual([failed]);
  });

  it("shuffleEndpoints returns the same members without mutating input", () => {
    const input = [
      "https://a.example/api/interpreter",
      "https://b.example/api/interpreter",
      "https://c.example/api/interpreter",
    ] as const;
    vi.spyOn(Math, "random").mockReturnValue(0);
    const shuffled = shuffleEndpoints(input);
    expect(shuffled).toHaveLength(input.length);
    expect(new Set(shuffled)).toEqual(new Set(input));
    expect(input[0]).toBe("https://a.example/api/interpreter");
  });
});
