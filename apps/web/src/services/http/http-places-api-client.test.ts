import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "places-core/overpass";
import type { PlaceSearchCriteria } from "places-core/places";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HttpPlacesApiClient,
  resolveApiBaseUrl,
} from "./http-places-api-client.js";

const criteria: PlaceSearchCriteria = {
  city: "Seattle",
  countryCode: "US",
};

const DEPLOY_REVISION_MISMATCH =
  /Deploy the web app and API from the same revision/;
const VITE_API_BASE_URL_REQUIRED = /VITE_API_BASE_URL is required/;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function hangingFetch(
  _input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    const rejectAborted = () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    if (init?.signal?.aborted) {
      rejectAborted();
      return;
    }
    init?.signal?.addEventListener("abort", rejectAborted, { once: true });
  });
}

function ndjsonResponse(lines: unknown[]): Response {
  const body = `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`;
  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson" },
    status: 200,
  });
}

describe("HttpPlacesApiClient abort fallback", () => {
  it("cancels fetch without AbortSignal.any when the caller aborts", async () => {
    const originalAny = AbortSignal.any;
    Object.defineProperty(AbortSignal, "any", {
      configurable: true,
      value: undefined,
    });

    let fetchSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      fetchSignal = init?.signal ?? undefined;
      return hangingFetch(_input, init);
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const client = new HttpPlacesApiClient("http://api.test");
      const controller = new AbortController();
      const pending = client.search(criteria, controller.signal);

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      controller.abort();

      await expect(pending).rejects.toSatisfy(
        (error: unknown) =>
          error instanceof DOMException && error.name === "AbortError",
      );
      expect(fetchSignal?.aborted).toBe(true);
    } finally {
      Object.defineProperty(AbortSignal, "any", {
        configurable: true,
        value: originalAny,
      });
    }
  });

  it("passes a timeout signal when no caller signal is provided", async () => {
    const fetchMock = vi.fn(async () =>
      ndjsonResponse([
        { body: { places: [], scope: {}, truncated: false }, type: "result" },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const client = new HttpPlacesApiClient("http://api.test");
    await client.search(criteria);

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit | undefined,
    ];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect((init?.headers as Record<string, string> | undefined)?.Accept).toBe(
      "application/x-ndjson",
    );
  });
});

describe("HttpPlacesApiClient response shape", () => {
  it("accepts a search result line with a places array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ndjsonResponse([
          { body: { places: [], scope: {}, truncated: false }, type: "result" },
        ]),
      ),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).resolves.toEqual({
      places: [],
      scope: {},
      truncated: false,
    });
  });

  it("rejects a search result without a places array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ndjsonResponse([{ body: { truncated: false }, type: "result" }]),
      ),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).rejects.toThrow(
      DEPLOY_REVISION_MISMATCH,
    );
  });

  it("rejects an export result without a places array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ndjsonResponse([{ body: {}, type: "result" }])),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.exportByGeometry(criteria, "POINT")).rejects.toThrow(
      DEPLOY_REVISION_MISMATCH,
    );
  });

  it("forwards overpassAttempt lines to onAttempt", async () => {
    const onAttempt = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ndjsonResponse([
          {
            endpoint: "https://overpass.example/api/interpreter",
            hostname: "overpass.example",
            index: 0,
            status: "started",
            type: "overpassAttempt",
          },
          {
            endpoint: "https://overpass.example/api/interpreter",
            hostname: "overpass.example",
            index: 0,
            status: "succeeded",
            type: "overpassAttempt",
          },
          {
            body: { places: [], scope: {}, truncated: false },
            type: "result",
          },
        ]),
      ),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await client.search(criteria, undefined, onAttempt);
    expect(onAttempt).toHaveBeenCalledTimes(2);
    expect(onAttempt.mock.calls[0]?.[0]).toMatchObject({
      hostname: "overpass.example",
      status: "started",
    });
  });

  it("throws detail from an embedded problem line", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ndjsonResponse([
          {
            detail: "Could not reach the Overpass API. Try again.",
            status: 502,
            title: "Upstream unavailable",
            type: "problem",
          },
        ]),
      ),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).rejects.toThrow(
      "Could not reach the Overpass API. Try again.",
    );
  });

  it("treats a stream that ends after attempts without a result as abort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        ndjsonResponse([
          {
            endpoint: "https://overpass.example/api/interpreter",
            hostname: "overpass.example",
            index: 0,
            status: "started",
            type: "overpassAttempt",
          },
        ]),
      ),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

describe("HttpPlacesApiClient errors", () => {
  it("surfaces problem+json detail on non-OK responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            detail: "Set a country before searching.",
            status: 422,
            title: "Validation failed",
            type: "https://places.local/errors/validation",
          },
          {
            headers: { "Content-Type": "application/problem+json" },
            status: 422,
          },
        ),
      ),
    );
    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).rejects.toThrow(
      "Set a country before searching.",
    );
  });

  it("maps aborted timeout signals to a timeout message", async () => {
    const timeout = new AbortController();
    timeout.abort();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeout.signal);
    vi.stubGlobal("fetch", vi.fn(hangingFetch));

    const client = new HttpPlacesApiClient("http://api.test");
    await expect(client.search(criteria)).rejects.toThrow(
      `Query timed out after about ${OVERPASS_CLIENT_TIMEOUT_SECONDS}s. Narrow the area or filters.`,
    );
  });
});

describe("resolveApiBaseUrl", () => {
  it("throws when VITE_API_BASE_URL is missing or blank", () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    expect(() => resolveApiBaseUrl()).toThrow(VITE_API_BASE_URL_REQUIRED);
  });

  it("returns the configured base URL", () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://api.example:8787");
    expect(resolveApiBaseUrl()).toBe("http://api.example:8787");
  });
});
