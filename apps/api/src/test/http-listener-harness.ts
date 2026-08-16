import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { OverpassAttemptListener } from "places-core/overpass-attempt";
import type {
  Place,
  PlaceGeometryType,
  PlaceSearchCriteria,
  PlaceSearchResult,
} from "places-core/places";
import { vi } from "vitest";
import type { ApiConfig } from "../config.js";
import { createRequestListener } from "../create-app.js";
import type { ApiServices } from "../create-services.js";
import { PlacesRateLimiter } from "../http/rate-limit.js";

export const EMPTY_SEARCH_RESULT: PlaceSearchResult = {
  places: [],
  scope: {},
  truncated: false,
};

/**
 * Builds a test ApiConfig with optional overrides.
 * @param overrides Partial config fields to replace.
 */
export function testConfig(overrides: Partial<ApiConfig> = {}): ApiConfig {
  return {
    corsOrigins: ["http://localhost:5173"],
    host: "127.0.0.1",
    maxBodyBytes: 1_048_576,
    nominatimEmail: "test@example.com",
    nominatimUserAgent: "PlacesAPI/test",
    port: 0,
    rateLimit: {
      burst: 2,
      maxConcurrent: 2,
      refillPerMinute: 1,
    },
    ...overrides,
  };
}

/**
 * Builds mocked ApiServices for HTTP listener tests.
 * @param overrides Optional search/export implementations.
 */
export function mockServices(overrides?: {
  exportByGeometry?: (
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ) => Promise<Place[]>;
  search?: (
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ) => Promise<PlaceSearchResult>;
}): ApiServices {
  const search = overrides?.search ?? (async () => EMPTY_SEARCH_RESULT);
  const exportByGeometry =
    overrides?.exportByGeometry ?? (async () => [] as Place[]);
  return {
    placeExport: {
      exportByGeometry: vi.fn(exportByGeometry),
    },
    placeSearch: {
      search: vi.fn(search),
    },
    taxonomy: {} as ApiServices["taxonomy"],
  };
}

/**
 * Starts an ephemeral Places API server, runs the callback, then closes.
 * @param config API config.
 * @param services Injected services.
 * @param run Callback receiving the base URL.
 * @param limiter Optional rate limiter (defaults from config).
 */
export async function withServer(
  config: ApiConfig,
  services: ApiServices,
  run: (baseUrl: string) => Promise<void>,
  limiter: PlacesRateLimiter = new PlacesRateLimiter(config.rateLimit),
): Promise<void> {
  const server = createServer(createRequestListener(config, services, limiter));
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
