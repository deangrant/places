import type { ServerResponse } from "node:http";
import type { OverpassAttemptEvent } from "places-core";
import type { ProblemDetails } from "./problem.js";

export const NDJSON_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";

/**
 * True when the client prefers NDJSON progress streams for search/export.
 * @param acceptHeader Raw Accept header value.
 */
export function wantsNdjsonProgress(acceptHeader: string | undefined): boolean {
  return (acceptHeader ?? "").includes("application/x-ndjson");
}

/**
 * Writes one NDJSON line and flushes so loaders see Overpass progress promptly.
 * @param res Node response (headers must already be sent for streaming).
 * @param line Serializable line object.
 */
export function writeNdjsonLine(res: ServerResponse, line: unknown): void {
  res.write(`${JSON.stringify(line)}\n`);
}

/**
 * Starts a 200 NDJSON response body for search/export progress.
 * @param res Node response.
 */
export function beginNdjsonProgress(res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", NDJSON_CONTENT_TYPE);
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Flush headers so the client can start reading attempt lines immediately.
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
}

/**
 * NDJSON line for one Overpass interpreter attempt.
 * @param event Attempt progress event.
 */
export function overpassAttemptLine(
  event: OverpassAttemptEvent,
): { type: "overpassAttempt" } & OverpassAttemptEvent {
  return { type: "overpassAttempt", ...event };
}

/**
 * NDJSON line for a successful search/export payload.
 * @param body Result body (PlaceSearchResult or `{ places }`).
 */
export function resultLine(body: unknown): { type: "result"; body: unknown } {
  return { body, type: "result" };
}

/**
 * NDJSON line for a domain problem after the stream has already started.
 * @param details Problem details (status is informational; HTTP stays 200).
 */
export function problemLine(details: ProblemDetails): {
  detail: string;
  errors?: Record<string, string[]>;
  problemType: string;
  status: number;
  title: string;
  type: "problem";
} {
  return {
    detail: details.detail,
    ...(details.errors ? { errors: details.errors } : {}),
    problemType: details.type,
    status: details.status,
    title: details.title,
    type: "problem",
  };
}
