import type { ServerResponse } from "node:http";
import { OVERPASS_CLIENT_TIMEOUT_SECONDS } from "places-core";

/**
 * AbortSignal for the overall Places route/UI timeout budget.
 *
 * Timeout only: wiring `res`/`socket` close after NDJSON header flush
 * false-aborted live searches. Browser cancel uses the fetch AbortSignal;
 * this bounds leftover server work when the client is gone.
 * @param timeoutMs Overall route budget (defaults to client timeout).
 */
export function createPlacesRouteTimeoutSignal(
  timeoutMs: number = OVERPASS_CLIENT_TIMEOUT_SECONDS * 1000,
): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/**
 * True when the response can no longer accept a body write.
 * @param res Outgoing response.
 */
export function isResponseClosed(res: ServerResponse): boolean {
  return res.writableEnded || res.destroyed;
}

/**
 * True when the error is a client cancellation (`AbortError`), not a timeout.
 * Soft Overpass timeouts use OverpassError / timeout copy and stay mapped.
 * @param error Thrown value from search/export.
 */
export function isAbortError(error: unknown): boolean {
  return hasErrorName(error, "AbortError");
}

/**
 * True when the route budget elapsed (TimeoutError), including when fetch
 * surfaces a plain AbortError after `AbortSignal.timeout` aborts the signal.
 * @param routeSignal Signal from {@link createPlacesRouteTimeoutSignal}.
 * @param error Thrown value from search/export.
 */
export function isRouteTimeout(
  routeSignal: AbortSignal,
  error: unknown,
): boolean {
  if (hasErrorName(error, "TimeoutError")) {
    return true;
  }
  return (
    routeSignal.aborted && hasErrorName(routeSignal.reason, "TimeoutError")
  );
}

/**
 * Value to pass to {@link mapDomainError} so route timeouts become 504 even
 * when the thrown error is a fetch AbortError.
 * @param error Thrown value from search/export.
 * @param routeSignal Signal from {@link createPlacesRouteTimeoutSignal}.
 */
export function errorForDomainMapping(
  error: unknown,
  routeSignal: AbortSignal,
): unknown {
  if (!isRouteTimeout(routeSignal, error)) {
    return error;
  }
  if (hasErrorName(error, "TimeoutError")) {
    return error;
  }
  if (hasErrorName(routeSignal.reason, "TimeoutError")) {
    return routeSignal.reason;
  }
  return new Error(
    `Query timed out after about ${OVERPASS_CLIENT_TIMEOUT_SECONDS}s. Narrow the area or filters.`,
    { cause: error },
  );
}

/**
 * True when search/export should quiet-end (no problem line) for cancel.
 * @param error Thrown value from search/export.
 * @param routeSignal Signal from {@link createPlacesRouteTimeoutSignal}.
 */
export function shouldQuietEndOnAbort(
  error: unknown,
  routeSignal: AbortSignal,
): boolean {
  return isAbortError(error) && !isRouteTimeout(routeSignal, error);
}

function hasErrorName(error: unknown, name: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === name
  );
}
