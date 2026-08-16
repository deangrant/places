import type { OverpassAttemptEvent } from "places-core/overpass-attempt";
import type { PlaceSearchResult } from "places-core/places";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiConfig } from "./config.js";
import {
  mockServices,
  testConfig,
  withServer,
} from "./test/http-listener-harness.js";

const ALLOWED_ORIGIN = "http://localhost:5173";

const GENEROUS_RATE_LIMIT = {
  burst: 100,
  maxConcurrent: 50,
  refillPerMinute: 100,
} as const;

const VALID_SEARCH = {
  categoryId: "coffee-shops",
  city: "Seattle",
  countryCode: "us",
};

const APPLICATION_JSON = /application\/json/;
const APPLICATION_NDJSON = /application\/x-ndjson/;
const UPSTREAM_UNAVAILABLE_TYPE = /\/upstream-unavailable$/;

function httpTestConfig(overrides: Partial<ApiConfig> = {}): ApiConfig {
  return testConfig({
    rateLimit: GENEROUS_RATE_LIMIT,
    ...overrides,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function readNdjsonLines(response: Response): Promise<unknown[]> {
  const text = await response.text();
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as unknown);
}

describe("createRequestListener NDJSON progress", () => {
  it("keeps bare JSON when Accept is application/json", async () => {
    const searchResult: PlaceSearchResult = {
      places: [],
      scope: {},
      truncated: false,
    };
    const services = mockServices({
      search: async () => searchResult,
    });

    await withServer(httpTestConfig(), services, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify(VALID_SEARCH),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Origin: ALLOWED_ORIGIN,
        },
        method: "POST",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toMatch(APPLICATION_JSON);
      await expect(response.json()).resolves.toEqual(searchResult);
    });
  });

  it("streams overpassAttempt lines then a result for NDJSON Accept", async () => {
    const searchResult: PlaceSearchResult = {
      places: [],
      scope: {},
      truncated: false,
    };
    const attempt: OverpassAttemptEvent = {
      endpoint: "https://overpass.example/api/interpreter",
      hostname: "overpass.example",
      index: 0,
      status: "started",
    };
    const services = mockServices({
      search: (_criteria, _signal, onAttempt) => {
        onAttempt?.(attempt);
        onAttempt?.({ ...attempt, status: "succeeded" });
        return Promise.resolve(searchResult);
      },
    });

    await withServer(httpTestConfig(), services, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify(VALID_SEARCH),
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
          Origin: ALLOWED_ORIGIN,
        },
        method: "POST",
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toMatch(APPLICATION_NDJSON);
      const lines = await readNdjsonLines(response);
      expect(lines).toEqual([
        { type: "overpassAttempt", ...attempt },
        { type: "overpassAttempt", ...attempt, status: "succeeded" },
        { body: searchResult, type: "result" },
      ]);
    });
  });

  it("ends an NDJSON stream with a problem line on domain failure", async () => {
    const services = mockServices({
      search: (_criteria, _signal, onAttempt) => {
        onAttempt?.({
          endpoint: "https://overpass.example/api/interpreter",
          hostname: "overpass.example",
          index: 0,
          status: "started",
        });
        return Promise.reject(
          new Error("Could not reach the Overpass API. Try again."),
        );
      },
    });

    await withServer(httpTestConfig(), services, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify(VALID_SEARCH),
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
          Origin: ALLOWED_ORIGIN,
        },
        method: "POST",
      });
      expect(response.status).toBe(200);
      const lines = await readNdjsonLines(response);
      expect(lines[0]).toMatchObject({
        hostname: "overpass.example",
        status: "started",
        type: "overpassAttempt",
      });
      expect(lines.at(-1)).toMatchObject({
        detail: "Could not reach the Overpass API. Try again.",
        problemType: expect.stringMatching(UPSTREAM_UNAVAILABLE_TYPE),
        status: 502,
        type: "problem",
      });
    });
  });

  it("ends an NDJSON stream without a problem line on AbortError", async () => {
    const attempt: OverpassAttemptEvent = {
      endpoint: "https://overpass.example/api/interpreter",
      hostname: "overpass.example",
      index: 0,
      status: "started",
    };
    const services = mockServices({
      search: (_criteria, _signal, onAttempt) => {
        onAttempt?.(attempt);
        return Promise.reject(
          new DOMException("The operation was aborted.", "AbortError"),
        );
      },
    });

    await withServer(httpTestConfig(), services, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify(VALID_SEARCH),
        headers: {
          Accept: "application/x-ndjson",
          "Content-Type": "application/json",
          Origin: ALLOWED_ORIGIN,
        },
        method: "POST",
      });
      expect(response.status).toBe(200);
      const lines = await readNdjsonLines(response);
      expect(lines).toEqual([{ type: "overpassAttempt", ...attempt }]);
      expect(
        lines.some((line) => (line as { type?: string }).type === "problem"),
      ).toBe(false);
    });
  });
});
