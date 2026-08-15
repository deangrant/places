import type {
  Place,
  PlaceGeometryType,
  PlaceSearchCriteria,
  PlaceSearchResult,
} from "places-core";
import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "places-core";

const TRAILING_SLASH = /\/$/;

/**
 * Runs Places map searches via the Places API.
 */
export interface IPlaceSearchService {
  /**
   * Runs a Places search for the given criteria.
   * @param criteria User filters.
   * @param signal Optional abort signal.
   */
  search: (
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
  ) => Promise<PlaceSearchResult>;
}

/**
 * Re-queries Places for CSV export with a chosen geometry type.
 */
export interface IPlaceGeometryExporter {
  /**
   * Re-runs the current criteria for CSV export with the chosen geometry type.
   * @param criteria Active search filters.
   * @param geometryType Effective export geometry type.
   * @param signal Optional abort signal.
   */
  exportByGeometry: (
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
  ) => Promise<Place[]>;
}

/**
 * HTTP client for Places search and geometry export against `apps/api`.
 */
export class HttpPlacesApiClient
  implements IPlaceSearchService, IPlaceGeometryExporter
{
  private readonly baseUrl: string;

  /**
   * @param baseUrl API origin (no trailing slash), e.g. `http://localhost:8787`.
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(TRAILING_SLASH, "");
  }

  /**
   * Runs a Places search for the given criteria.
   */
  async search(
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
  ): Promise<PlaceSearchResult> {
    const body = await this.postJson("/places/search", criteria, signal);
    return parsePlaceSearchResult(body);
  }

  /**
   * Re-queries places for CSV export with one geometry type.
   */
  async exportByGeometry(
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
  ): Promise<Place[]> {
    const body = await this.postJson(
      "/places/export",
      { criteria, geometryType },
      signal,
    );
    return parseExportPlaces(body);
  }

  /**
   * POSTs JSON to the API and maps problem+json failures to Error.
   * Success bodies are cast under the monorepo DTO contract after a light shape check.
   * @param path API path.
   * @param body Request JSON body.
   * @param signal Optional abort signal.
   */
  private async postJson(
    path: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const timeout = AbortSignal.timeout(OVERPASS_CLIENT_TIMEOUT_SECONDS * 1000);
    const combined = combineAbortSignals(signal, timeout);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: combined,
      });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      if (timeout.aborted) {
        throw new Error(
          `Query timed out after about ${OVERPASS_CLIENT_TIMEOUT_SECONDS}s. Narrow the area or filters.`,
          { cause: error },
        );
      }
      throw new Error(
        "Could not reach the Places API. Check that the API is running and try again.",
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new Error(await readApiErrorMessage(response));
    }

    return response.json();
  }
}

const UNEXPECTED_API_RESPONSE =
  "Places API returned an unexpected response. Deploy the web app and API from the same revision.";

/**
 * Minimal search success shape check (not a full Place schema).
 * @param value Parsed JSON body.
 */
function parsePlaceSearchResult(value: unknown): PlaceSearchResult {
  if (!(isPlainObject(value) && Array.isArray(value.places))) {
    throw new Error(UNEXPECTED_API_RESPONSE);
  }
  return value as PlaceSearchResult;
}

/**
 * Minimal export success shape check (not a full Place schema).
 * @param value Parsed JSON body.
 */
function parseExportPlaces(value: unknown): Place[] {
  if (!(isPlainObject(value) && Array.isArray(value.places))) {
    throw new Error(UNEXPECTED_API_RESPONSE);
  }
  return value.places as Place[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Combines an optional caller signal with a timeout signal.
 * @param caller Optional caller abort signal.
 * @param timeout Timeout abort signal.
 */
function combineAbortSignals(
  caller: AbortSignal | undefined,
  timeout: AbortSignal,
): AbortSignal {
  if (!caller) {
    return timeout;
  }
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([caller, timeout]);
  }
  return linkAbortSignals(caller, timeout);
}

/**
 * Fallback when `AbortSignal.any` is unavailable: abort when either input aborts.
 * @param caller Caller abort signal.
 * @param timeout Timeout abort signal.
 */
function linkAbortSignals(
  caller: AbortSignal,
  timeout: AbortSignal,
): AbortSignal {
  const controller = new AbortController();
  const forward = () => {
    controller.abort();
  };
  if (caller.aborted || timeout.aborted) {
    controller.abort();
    return controller.signal;
  }
  caller.addEventListener("abort", forward, { once: true });
  timeout.addEventListener("abort", forward, { once: true });
  return controller.signal;
}

/**
 * Reads a user-facing message from a failed API response.
 * @param response Failed fetch response.
 */
async function readApiErrorMessage(response: Response): Promise<string> {
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const retrySeconds = retryAfter ? Number(retryAfter) : Number.NaN;
    const retryHint =
      Number.isFinite(retrySeconds) && retrySeconds > 0
        ? ` Try again in about ${Math.ceil(retrySeconds)}s.`
        : " Try again shortly.";
    try {
      const contentType = response.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/problem+json")) {
        const problem = (await response.json()) as { detail?: string };
        if (problem.detail) {
          return problem.detail;
        }
      }
    } catch {
      // Fall through to status-based message.
    }
    return `Too many Places queries right now.${retryHint}`;
  }

  try {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/problem+json")) {
      const problem = (await response.json()) as { detail?: string };
      if (problem.detail) {
        return problem.detail;
      }
    }
  } catch {
    // Fall through to status-based message.
  }
  return `Places API request failed (HTTP ${response.status}).`;
}

/**
 * Resolves the API base URL from Vite env.
 */
export function resolveApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!value) {
    throw new Error(
      "VITE_API_BASE_URL is required. Copy apps/web/.env.example to apps/web/.env.",
    );
  }
  return value;
}
