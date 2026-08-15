import { type ProblemDetails, problem } from "./problem.js";

const TIMEOUT_MESSAGE = /timed out|timeout/i;
const UPSTREAM_UNAVAILABLE_MESSAGE =
  /rate-limiting|Could not reach the Overpass|Location search failed/i;
const VALIDATION_MESSAGE =
  /Choose a category|Set a country|Could not resolve|Set both OSM|Unsupported OSM|Unknown category|Spatial scope requires/i;

/**
 * Maps a domain/pipeline error to RFC 9457 problem details.
 *
 * Client-domain validation failures become 422. True upstream failures stay
 * 502/504 so operators do not treat bad requests as outages.
 * @param error Thrown value from search/export handlers.
 */
export function mapDomainError(error: unknown): ProblemDetails {
  if (
    typeof error === "object" &&
    error !== null &&
    "problem" in error &&
    error.problem
  ) {
    return (error as { problem: ProblemDetails }).problem;
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server failure.";

  if (TIMEOUT_MESSAGE.test(message)) {
    return problem(504, "Upstream timeout", message, "/upstream-timeout");
  }
  if (UPSTREAM_UNAVAILABLE_MESSAGE.test(message)) {
    return problem(
      502,
      "Upstream unavailable",
      message,
      "/upstream-unavailable",
    );
  }
  if (VALIDATION_MESSAGE.test(message)) {
    return problem(422, "Validation failed", message, "/validation");
  }

  return problem(502, "Upstream rejected", message, "/upstream-rejected");
}
