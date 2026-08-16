import type { OverpassResponse } from "places-core/places";
import { OverpassError } from "./overpass-error.js";

/**
 * Parses an Overpass interpreter HTTP response body into JSON.
 * @param text Raw response body.
 * @throws OverpassError when the body is not usable Overpass JSON.
 */
export function parseOverpassResponseBody(text: string): OverpassResponse {
  let parsed: OverpassResponse;
  try {
    parsed = JSON.parse(text) as OverpassResponse;
  } catch (error) {
    if (isOverpassPlainTextError(text)) {
      throw new OverpassError(
        "Overpass rejected the query. Narrow the area or simplify filters.",
        { cause: error },
      );
    }
    throw new OverpassError(
      "Overpass returned an unexpected response. Try a smaller search area.",
      { cause: error },
    );
  }

  if (!Array.isArray(parsed.elements)) {
    throw new OverpassError("Overpass response was missing place elements.");
  }

  return parsed;
}

/**
 * True when a non-JSON Overpass body looks like an interpreter error envelope.
 * Only used after JSON.parse fails so OSM tag substrings cannot false-positive.
 * @param text Raw response body.
 */
export function isOverpassPlainTextError(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("runtime error:") || trimmed.startsWith("error:");
}

/**
 * Maps Overpass HTTP status codes to user-facing messages.
 * @param status HTTP status from the Overpass response.
 */
export function overpassStatusMessage(status: number): string {
  if (status === 429) {
    return "The Overpass server is rate-limiting requests. Wait a moment and retry.";
  }
  if (status === 504 || status === 408) {
    return "The Overpass query timed out. Narrow the area or filters.";
  }
  return `Overpass request failed (HTTP ${status}).`;
}
