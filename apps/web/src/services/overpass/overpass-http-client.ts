import {
  OVERPASS_ENDPOINT,
  OVERPASS_TIMEOUT_SECONDS,
} from "@/constants/api.constants";
import type { OverpassResponse } from "@/types/places.types";

/**
 * Low-level Overpass interpreter client.
 */
export interface IOverpassClient {
  /**
   * Executes an Overpass QL query and returns the JSON response.
   * @param query Complete Overpass QL script.
   * @param signal Optional abort signal for cancellation.
   */
  query: (query: string, signal?: AbortSignal) => Promise<OverpassResponse>;
}

/**
 * Error raised when Overpass returns a non-success HTTP status or empty body.
 */
export class OverpassError extends Error {
  readonly status?: number;

  /**
   * @param message Human-readable error summary.
   * @param options Optional status and Error cause.
   */
  constructor(message: string, options?: ErrorOptions & { status?: number }) {
    super(message, options);
    this.name = "OverpassError";
    this.status = options?.status;
  }
}

/**
 * HTTP Overpass client using the public interpreter endpoint.
 */
export class OverpassHttpClient implements IOverpassClient {
  private readonly endpoint: string;
  private readonly timeoutMs: number;

  /**
   * @param endpoint Overpass interpreter URL.
   * @param timeoutMs Client-side abort budget in milliseconds.
   */
  constructor(
    endpoint: string = OVERPASS_ENDPOINT,
    timeoutMs: number = OVERPASS_TIMEOUT_SECONDS * 1000,
  ) {
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
  }

  /** @inheritdoc */
  async query(query: string, signal?: AbortSignal): Promise<OverpassResponse> {
    const body = new URLSearchParams({ data: query });
    const timeout = createTimeoutSignal(this.timeoutMs);
    const combined = combineAbortSignals(signal, timeout.signal);
    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        body,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        method: "POST",
        signal: combined,
      });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      if (timeout.signal.aborted) {
        throw new OverpassError(overpassTimeoutMessage(), { cause: error });
      }
      throw new OverpassError(
        "Could not reach the Overpass API. Check your network and try again.",
        { cause: error },
      );
    } finally {
      timeout.clear();
    }

    if (!response.ok) {
      throw new OverpassError(overpassStatusMessage(response.status), {
        status: response.status,
      });
    }

    const text = await response.text();

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
}

/**
 * User-facing message when an Overpass query hits the soft timeout budget.
 */
export function overpassTimeoutMessage(): string {
  return `Query timed out after about ${OVERPASS_TIMEOUT_SECONDS}s. Narrow the area or filters.`;
}

/**
 * True when a non-JSON Overpass body looks like an interpreter error envelope.
 * Only used after JSON.parse fails so OSM tag substrings cannot false-positive.
 * @param text Raw response body.
 */
function isOverpassPlainTextError(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("runtime error:") || trimmed.startsWith("error:");
}

/**
 * Maps Overpass HTTP status codes to user-facing messages.
 * @param status HTTP status from the Overpass response.
 */
function overpassStatusMessage(status: number): string {
  if (status === 429) {
    return "The Overpass server is rate-limiting requests. Wait a moment and retry.";
  }
  if (status === 504 || status === 408) {
    return "The Overpass query timed out. Narrow the area or filters.";
  }
  return `Overpass request failed (HTTP ${status}).`;
}

/**
 * Builds a friendly message for Overpass timeout remarks.
 * @param remark Optional remark from the Overpass JSON payload.
 */
export function describeOverpassRemark(remark?: string): string | undefined {
  if (!remark) {
    return;
  }
  if (remark.toLowerCase().includes("timeout")) {
    return overpassTimeoutMessage();
  }
  return remark;
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
 * Creates an abort signal that fires after `timeoutMs`, with optional cleanup.
 * @param timeoutMs Milliseconds until abort.
 */
function createTimeoutSignal(timeoutMs: number): {
  clear: () => void;
  signal: AbortSignal;
} {
  if (typeof AbortSignal.timeout === "function") {
    return {
      clear: () => undefined,
      signal: AbortSignal.timeout(timeoutMs),
    };
  }

  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return {
    clear: () => {
      clearTimeout(timerId);
    },
    signal: controller.signal,
  };
}
