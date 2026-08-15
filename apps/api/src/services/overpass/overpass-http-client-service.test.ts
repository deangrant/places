import {
  OVERPASS_ATTEMPT_TIMEOUT_SECONDS,
  OVERPASS_CLIENT_TIMEOUT_SECONDS,
  OVERPASS_TIMEOUT_SECONDS,
} from "places-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OverpassError } from "./overpass-error.js";
import {
  describeOverpassRemark,
  hostnameFromEndpoint,
  isRetryableOverpassFailure,
  type OverpassAttemptEvent,
  OverpassHttpClient,
  overpassTimeoutMessage,
  shuffleEndpoints,
} from "./overpass-http-client-service.js";

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

function hangingFetch(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      },
      { once: true },
    );
  });
}

describe("OverpassHttpClient default fetchImpl", () => {
  it("uses globalThis.fetch when no fetchImpl is injected", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ elements: [{ id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OverpassHttpClient(
      ["https://example.test/interpreter"],
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );
    const response = await client.query("[out:json];out;");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://example.test/interpreter",
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Accept).toBe("application/json");
    expect(headers?.["User-Agent"]).toBeUndefined();
    expect(response.elements).toEqual([{ id: 1 }]);
  });

  it("sends Accept and User-Agent when a userAgent is configured", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ elements: [{ id: 1 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OverpassHttpClient(
      ["https://example.test/interpreter"],
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
      identityOrder,
      undefined,
      "PlacesExplorer/1.0 (test@example.org)",
    );
    await client.query("[out:json];out;");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.Accept).toBe("application/json");
    expect(headers?.["User-Agent"]).toBe(
      "PlacesExplorer/1.0 (test@example.org)",
    );
    expect(headers?.["Content-Type"]).toBe(
      "application/x-www-form-urlencoded;charset=UTF-8",
    );
  });
});

describe("OverpassHttpClient query timeout", () => {
  it("throws OverpassError when the client timeout elapses", async () => {
    vi.stubGlobal("fetch", vi.fn(hangingFetch));

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
    vi.stubGlobal("fetch", vi.fn(hangingFetch));

    const controller = new AbortController();
    const client = new OverpassHttpClient(
      ["https://example.test/interpreter"],
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
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
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
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
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
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
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );

    await expect(client.query("[out:json];out;")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OverpassError && error.status === 400,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tries the next endpoint after HTTP 406", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("not acceptable", { status: 406 }))
      .mockResolvedValueOnce(jsonResponse({ elements: [{ id: 2 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );

    const result = await client.query("[out:json];out;");

    expect(result.elements).toEqual([{ id: 2 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://second.example/api/interpreter",
    );
  });

  it("tries the next endpoint after client timeout", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(hangingFetch)
      .mockResolvedValueOnce(jsonResponse({ elements: [{ id: 1 }] }));
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

    const result = await client.query("[out:json];out;", undefined, (event) => {
      attempts.push(event);
    });

    expect(result.elements).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(attempts.map((entry) => entry.status)).toEqual([
      "started",
      "timed_out",
      "started",
      "succeeded",
    ]);
  });

  it("soft-timeout failovers when the caller budget outlives the attempt timeout", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(hangingFetch)
      .mockResolvedValueOnce(jsonResponse({ elements: [{ id: 42 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const attempts: OverpassAttemptEvent[] = [];
    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      25,
      identityOrder,
    );
    // Shared route-style signal: large enough for two short attempts.
    const caller = AbortSignal.timeout(200);

    const result = await client.query("[out:json];out;", caller, (event) => {
      attempts.push(event);
    });

    expect(result.elements).toEqual([{ id: 42 }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(attempts.map((entry) => entry.status)).toEqual([
      "started",
      "timed_out",
      "started",
      "succeeded",
    ]);
  });

  it("does not return a later endpoint when the caller budget matches the attempt timeout", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(hangingFetch)
      .mockResolvedValueOnce(jsonResponse({ elements: [{ id: 99 }] }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      40,
      identityOrder,
    );
    // Same wall-clock as attempt soft timeout: soft-timeout failover is ineffective.
    const caller = AbortSignal.timeout(40);

    await expect(client.query("[out:json];out;", caller)).rejects.toBeTruthy();
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://first.example/api/interpreter",
    );
  });

  it("stops after three endpoint attempts when four are available", async () => {
    const fetchMock = vi.fn((_input: string | URL, _init?: RequestInit) =>
      Promise.reject(new TypeError("Failed to fetch")),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new OverpassHttpClient(
      [
        "https://a.example/api/interpreter",
        "https://b.example/api/interpreter",
        "https://c.example/api/interpreter",
        "https://d.example/api/interpreter",
      ],
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );

    await expect(client.query("[out:json];out;")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OverpassError &&
        error.message.includes("Could not reach"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "https://a.example/api/interpreter",
      "https://b.example/api/interpreter",
      "https://c.example/api/interpreter",
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
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
      identityOrder,
    );

    await expect(client.query("[out:json];out;")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof OverpassError &&
        error.message.includes("Could not reach"),
    );
  });

  it("does not continue after caller abort on the first attempt", async () => {
    const fetchMock = vi.fn(hangingFetch);
    vi.stubGlobal("fetch", fetchMock);

    const controller = new AbortController();
    const client = new OverpassHttpClient(
      [
        "https://first.example/api/interpreter",
        "https://second.example/api/interpreter",
      ],
      OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
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
  it("includes the overall client budget seconds, not the QL timeout", () => {
    expect(overpassTimeoutMessage()).toContain(
      String(OVERPASS_CLIENT_TIMEOUT_SECONDS),
    );
    expect(overpassTimeoutMessage()).not.toContain(
      String(OVERPASS_TIMEOUT_SECONDS),
    );
    expect(OVERPASS_ATTEMPT_TIMEOUT_SECONDS).toBeLessThan(
      OVERPASS_CLIENT_TIMEOUT_SECONDS,
    );
  });

  it("maps Overpass remarks to user-safe messages", () => {
    expect(describeOverpassRemark()).toBeUndefined();
    expect(describeOverpassRemark("")).toBeUndefined();
    expect(describeOverpassRemark("runtime error: Query timed out")).toBe(
      `Query timed out after about ${OVERPASS_TIMEOUT_SECONDS}s. Narrow the area or filters.`,
    );
    expect(describeOverpassRemark("runtime error: Query timeout")).toBe(
      `Query timed out after about ${OVERPASS_TIMEOUT_SECONDS}s. Narrow the area or filters.`,
    );
    expect(
      describeOverpassRemark(
        'runtime error: Query run out of memory in "recurse" at line 1',
      ),
    ).toBe(
      "Query ran out of memory on the Overpass server. Narrow the area or filters.",
    );
    const generic = describeOverpassRemark(
      "runtime error: open64: 0 Success - reconstruct_items::1",
    );
    expect(generic).toBe(
      "Overpass could not complete this query. Narrow the area or filters and try again.",
    );
    expect(generic).not.toContain("open64");
  });

  it("extracts hostnames from interpreter URLs", () => {
    expect(
      hostnameFromEndpoint("https://overpass.private.coffee/api/interpreter"),
    ).toBe("overpass.private.coffee");
  });

  it("treats timeouts, 406, 429, and 5xx as retryable and 400 as not", () => {
    expect(
      isRetryableOverpassFailure(new OverpassError("limited", { status: 429 })),
    ).toBe(true);
    expect(
      isRetryableOverpassFailure(new OverpassError("reject", { status: 406 })),
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
    ).toBe(true);
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
