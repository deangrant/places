import type { Place, PlaceSearchResult } from "places-core";
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

const SEARCH_HEADERS = {
  "Content-Type": "application/json",
  Origin: ALLOWED_ORIGIN,
};

const FORBIDDEN_TYPE = /\/forbidden$/;
const NOT_FOUND_TYPE = /\/not-found$/;
const METHOD_NOT_ALLOWED_TYPE = /\/method-not-allowed$/;
const PAYLOAD_TOO_LARGE_TYPE = /\/payload-too-large$/;
const BAD_REQUEST_TYPE = /\/bad-request$/;

function httpTestConfig(overrides: Partial<ApiConfig> = {}): ApiConfig {
  return testConfig({
    rateLimit: GENEROUS_RATE_LIMIT,
    ...overrides,
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createRequestListener HTTP contract", () => {
  it("reflects an allowlisted Origin on successful responses", async () => {
    await withServer(httpTestConfig(), mockServices(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health/live`, {
        headers: { Origin: ALLOWED_ORIGIN },
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        ALLOWED_ORIGIN,
      );
    });
  });

  it("rejects a disallowed Origin with 403", async () => {
    await withServer(httpTestConfig(), mockServices(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health/live`, {
        headers: { Origin: "https://evil.example" },
      });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        status: 403,
        type: expect.stringMatching(FORBIDDEN_TYPE),
      });
    });
  });

  it("answers OPTIONS preflight with 204 for an allowlisted Origin", async () => {
    await withServer(httpTestConfig(), mockServices(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/places/search`, {
        headers: { Origin: ALLOWED_ORIGIN },
        method: "OPTIONS",
      });
      expect(response.status).toBe(204);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        ALLOWED_ORIGIN,
      );
    });
  });

  it("returns 404 for unknown paths", async () => {
    await withServer(httpTestConfig(), mockServices(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/nope`);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        status: 404,
        type: expect.stringMatching(NOT_FOUND_TYPE),
      });
    });
  });

  it("returns 405 for GET on places routes", async () => {
    await withServer(httpTestConfig(), mockServices(), async (baseUrl) => {
      for (const path of ["/places/search", "/places/export"] as const) {
        // biome-ignore lint/performance/noAwaitInLoops: sequential assertion order
        const response = await fetch(`${baseUrl}${path}`, { method: "GET" });
        expect(response.status).toBe(405);
        await expect(response.json()).resolves.toMatchObject({
          detail: `GET is not allowed for ${path}.`,
          status: 405,
          type: expect.stringMatching(METHOD_NOT_ALLOWED_TYPE),
        });
      }
    });
  });

  it("returns 413 when the body exceeds maxBodyBytes", async () => {
    await withServer(
      httpTestConfig({ maxBodyBytes: 32 }),
      mockServices(),
      async (baseUrl) => {
        const response = await fetch(`${baseUrl}/places/search`, {
          body: JSON.stringify({
            ...VALID_SEARCH,
            nameContains: "x".repeat(200),
          }),
          headers: SEARCH_HEADERS,
          method: "POST",
        });
        expect(response.status).toBe(413);
        await expect(response.json()).resolves.toMatchObject({
          status: 413,
          type: expect.stringMatching(PAYLOAD_TOO_LARGE_TYPE),
        });
      },
    );
  });

  it("returns 400 for malformed JSON", async () => {
    await withServer(httpTestConfig(), mockServices(), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/places/search`, {
        body: "{not-json",
        headers: SEARCH_HEADERS,
        method: "POST",
      });
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        status: 400,
        type: expect.stringMatching(BAD_REQUEST_TYPE),
      });
    });
  });

  it("returns 422 for unknown properties, bad country, and unknown categoryId", async () => {
    await withServer(httpTestConfig(), mockServices(), async (baseUrl) => {
      const unknownKey = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify({ ...VALID_SEARCH, unexpected: true }),
        headers: SEARCH_HEADERS,
        method: "POST",
      });
      expect(unknownKey.status).toBe(422);
      await expect(unknownKey.json()).resolves.toMatchObject({
        errors: { unexpected: ["is not an allowed property"] },
        status: 422,
      });

      const badCountry = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify({
          categoryId: "coffee-shops",
          countryCode: "USA",
        }),
        headers: SEARCH_HEADERS,
        method: "POST",
      });
      expect(badCountry.status).toBe(422);
      await expect(badCountry.json()).resolves.toMatchObject({
        errors: {
          countryCode: ["must be a 2-letter ISO country code"],
        },
        status: 422,
      });

      const unknownCategory = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify({
          categoryId: "not-a-real-category",
          countryCode: "us",
        }),
        headers: SEARCH_HEADERS,
        method: "POST",
      });
      expect(unknownCategory.status).toBe(422);
      await expect(unknownCategory.json()).resolves.toMatchObject({
        errors: {
          categoryId: [expect.stringContaining("unknown category id")],
        },
        status: 422,
      });
    });
  });

  it("returns mocked search and export happy-path bodies", async () => {
    const searchResult: PlaceSearchResult = {
      places: [],
      scope: {},
      truncated: false,
    };
    const exported: Place[] = [];
    const services = mockServices({
      exportByGeometry: async () => exported,
      search: async () => searchResult,
    });

    await withServer(httpTestConfig(), services, async (baseUrl) => {
      const search = await fetch(`${baseUrl}/places/search`, {
        body: JSON.stringify(VALID_SEARCH),
        headers: SEARCH_HEADERS,
        method: "POST",
      });
      expect(search.status).toBe(200);
      await expect(search.json()).resolves.toEqual(searchResult);
      expect(services.placeSearch.search).toHaveBeenCalled();

      const exportResponse = await fetch(`${baseUrl}/places/export`, {
        body: JSON.stringify({
          criteria: VALID_SEARCH,
          geometryType: "POINT",
        }),
        headers: SEARCH_HEADERS,
        method: "POST",
      });
      expect(exportResponse.status).toBe(200);
      await expect(exportResponse.json()).resolves.toEqual({
        places: exported,
      });
      expect(services.placeExport.exportByGeometry).toHaveBeenCalled();
    });
  });

  it("maps domain validation and upstream errors through the listener", async () => {
    const cases: { message: string; status: number; typeSuffix: string }[] = [
      {
        message: "Unknown category id: missing",
        status: 422,
        typeSuffix: "/validation",
      },
      {
        message:
          "Choose a category, brand, place name, or OSM tag before searching.",
        status: 422,
        typeSuffix: "/validation",
      },
      {
        message: "Query timed out after about 50s. Narrow the area or filters.",
        status: 504,
        typeSuffix: "/upstream-timeout",
      },
      {
        message: "Could not reach the Overpass API. Try again.",
        status: 502,
        typeSuffix: "/upstream-unavailable",
      },
    ];

    for (const { message, status, typeSuffix } of cases) {
      const services = mockServices({
        search: () => Promise.reject(new Error(message)),
      });
      // biome-ignore lint/performance/noAwaitInLoops: sequential assertion order
      await withServer(httpTestConfig(), services, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/places/search`, {
          body: JSON.stringify(VALID_SEARCH),
          headers: SEARCH_HEADERS,
          method: "POST",
        });
        expect(response.status).toBe(status);
        await expect(response.json()).resolves.toMatchObject({
          detail: message,
          status,
          type: expect.stringMatching(new RegExp(`${typeSuffix}$`)),
        });
      });
    }
  });
});
