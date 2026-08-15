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
  search(
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
  ): Promise<PlaceSearchResult> {
    return this.postJson<PlaceSearchResult>("/places/search", criteria, signal);
  }

  /**
   * Re-queries places for CSV export with one geometry type.
   */
  async exportByGeometry(
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
  ): Promise<Place[]> {
    const body = await this.postJson<{ places: Place[] }>(
      "/places/export",
      { criteria, geometryType },
      signal,
    );
    return body.places;
  }

  /**
   * POSTs JSON to the API and maps problem+json failures to Error.
   * @param path API path.
   * @param body Request JSON body.
   * @param signal Optional abort signal.
   */
  private async postJson<T>(
    path: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const timeout = AbortSignal.timeout(OVERPASS_CLIENT_TIMEOUT_SECONDS * 1000);
    const combined =
      signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([signal, timeout])
        : timeout;

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

    return (await response.json()) as T;
  }
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
