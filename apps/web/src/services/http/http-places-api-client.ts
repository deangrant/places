import type {
  OverpassAttemptEvent,
  OverpassAttemptListener,
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
   * @param onAttempt Optional Overpass endpoint progress callback.
   */
  search: (
    criteria: PlaceSearchCriteria,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
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
   * @param onAttempt Optional Overpass endpoint progress callback.
   */
  exportByGeometry: (
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
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
    onAttempt?: OverpassAttemptListener,
  ): Promise<PlaceSearchResult> {
    const body = await this.postNdjson(
      "/places/search",
      criteria,
      signal,
      onAttempt,
    );
    return parsePlaceSearchResult(body);
  }

  /**
   * Re-queries places for CSV export with one geometry type.
   */
  async exportByGeometry(
    criteria: PlaceSearchCriteria,
    geometryType: PlaceGeometryType,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ): Promise<Place[]> {
    const body = await this.postNdjson(
      "/places/export",
      { criteria, geometryType },
      signal,
      onAttempt,
    );
    return parseExportPlaces(body);
  }

  /**
   * POSTs JSON and reads an NDJSON progress stream (attempts + final result).
   * @param path API path.
   * @param body Request JSON body.
   * @param signal Optional abort signal.
   * @param onAttempt Optional Overpass progress callback.
   */
  private async postNdjson(
    path: string,
    body: unknown,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ): Promise<unknown> {
    const timeout = AbortSignal.timeout(OVERPASS_CLIENT_TIMEOUT_SECONDS * 1000);
    const combined = combineAbortSignals(signal, timeout);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        body: JSON.stringify(body),
        headers: {
          Accept: "application/x-ndjson",
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

    return readNdjsonResult(response, onAttempt);
  }
}

const UNEXPECTED_API_RESPONSE =
  "Places API returned an unexpected response. Deploy the web app and API from the same revision.";

/**
 * Reads NDJSON attempt/result/problem lines until a final result or problem.
 * @param response OK fetch response.
 * @param onAttempt Optional progress callback.
 */
async function readNdjsonResult(
  response: Response,
  onAttempt?: OverpassAttemptListener,
): Promise<unknown> {
  if (!response.body) {
    throw new Error(UNEXPECTED_API_RESPONSE);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawProgress = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      const parsed = parseNdjsonLine(trimmed);
      if (parsed.kind === "attempt") {
        sawProgress = true;
        onAttempt?.(parsed.event);
        continue;
      }
      if (parsed.kind === "problem") {
        throw new Error(parsed.detail);
      }
      return parsed.body;
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    const parsed = parseNdjsonLine(trailing);
    if (parsed.kind === "attempt") {
      sawProgress = true;
      onAttempt?.(parsed.event);
    } else if (parsed.kind === "problem") {
      throw new Error(parsed.detail);
    } else {
      return parsed.body;
    }
  }

  // Intentional: API quiet-ends NDJSON on cancel after attempt lines (no result
  // or problem). Treat that EOF as AbortError so UI cancel stays silent.
  if (sawProgress) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  throw new Error(UNEXPECTED_API_RESPONSE);
}

type NdjsonParsed =
  | { kind: "attempt"; event: OverpassAttemptEvent }
  | { kind: "result"; body: unknown }
  | { kind: "problem"; detail: string };

/**
 * Parses one NDJSON progress/result/problem line.
 * @param line Trimmed JSON line.
 */
function parseNdjsonLine(line: string): NdjsonParsed {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error(UNEXPECTED_API_RESPONSE);
  }
  if (!isPlainObject(value) || typeof value.type !== "string") {
    throw new Error(UNEXPECTED_API_RESPONSE);
  }
  if (value.type === "overpassAttempt") {
    const { type: _type, ...event } = value;
    return { event: event as unknown as OverpassAttemptEvent, kind: "attempt" };
  }
  if (value.type === "result") {
    return { body: value.body, kind: "result" };
  }
  if (value.type === "problem") {
    const detail =
      typeof value.detail === "string"
        ? value.detail
        : "Places API request failed.";
    return { detail, kind: "problem" };
  }
  throw new Error(UNEXPECTED_API_RESPONSE);
}

/**
 * Minimal search success shape check (not a full Place schema).
 * @param value Parsed JSON body.
 */
function parsePlaceSearchResult(value: unknown): PlaceSearchResult {
  if (!(isPlainObject(value) && Array.isArray(value.places))) {
    throw new Error(UNEXPECTED_API_RESPONSE);
  }
  return value as unknown as PlaceSearchResult;
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
