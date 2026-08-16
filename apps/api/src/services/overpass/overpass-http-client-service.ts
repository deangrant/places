import {
  OVERPASS_ATTEMPT_TIMEOUT_SECONDS,
  OVERPASS_CLIENT_TIMEOUT_SECONDS,
  OVERPASS_ENDPOINTS,
  OVERPASS_MAX_ENDPOINT_ATTEMPTS,
  OVERPASS_RETRY_BASE_MS,
  OVERPASS_RETRY_MAX_MS,
  OVERPASS_TIMEOUT_SECONDS,
} from "places-core/overpass";
import type { OverpassAttemptListener } from "places-core/overpass-attempt";
import type { OverpassResponse } from "places-core/places";
import { OverpassError } from "./overpass-error.js";
import {
  overpassStatusMessage,
  parseOverpassResponseBody,
} from "./overpass-response-parser.js";

export type {
  OverpassAttemptEvent,
  OverpassAttemptListener,
  OverpassAttemptStatus,
} from "places-core/overpass-attempt";

/**
 * Low-level Overpass interpreter client.
 */
export interface IOverpassClient {
  /**
   * Executes an Overpass QL query and returns the JSON response.
   * @param query Complete Overpass QL script.
   * @param signal Optional abort signal for cancellation.
   * @param onAttempt Optional per-endpoint progress callback.
   */
  query: (
    query: string,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ) => Promise<OverpassResponse>;
}

/** Fetch-compatible function used by the Overpass HTTP client. */
export type OverpassFetch = typeof fetch;

/** Abort-aware delay used between interpreter failover attempts. */
export type OverpassSleep = (ms: number, signal?: AbortSignal) => Promise<void>;

/** Unit interval random source for backoff jitter. */
export type OverpassRandom = () => number;

/**
 * Default fetch that keeps the correct `globalThis` receiver.
 * Storing unbound `fetch` and calling it later throws Illegal invocation in browsers.
 */
const defaultOverpassFetch: OverpassFetch = (input, init) =>
  globalThis.fetch(input, init);

/**
 * HTTP Overpass client with randomized sequential failover across interpreters.
 */
export class OverpassHttpClient implements IOverpassClient {
  private readonly endpoints: readonly string[];
  private readonly timeoutMs: number;
  private readonly shuffle: (endpoints: readonly string[]) => string[];
  private readonly fetchImpl: OverpassFetch;
  private readonly userAgent: string | undefined;
  private readonly sleep: OverpassSleep;
  private readonly random: OverpassRandom;

  /**
   * @param endpoints Interpreter URLs (shuffled per query unless overridden).
   * @param timeoutMs Soft abort budget in milliseconds per interpreter attempt.
   * @param shuffle Endpoint orderer; defaults to Fisher–Yates shuffle.
   * @param fetchImpl HTTP fetch implementation; defaults to globalThis.fetch.
   * @param userAgent Identifying User-Agent for public Overpass mirrors.
   * @param sleep Delay between failover attempts; defaults to abort-aware sleep.
   * @param random Unit interval RNG for backoff jitter; defaults to Math.random.
   */
  constructor(
    endpoints: readonly string[] = OVERPASS_ENDPOINTS,
    timeoutMs: number = OVERPASS_ATTEMPT_TIMEOUT_SECONDS * 1000,
    shuffle: (endpoints: readonly string[]) => string[] = shuffleEndpoints,
    fetchImpl: OverpassFetch = defaultOverpassFetch,
    userAgent?: string,
    sleep: OverpassSleep = sleepWithAbort,
    random: OverpassRandom = Math.random,
  ) {
    this.endpoints = endpoints;
    this.timeoutMs = timeoutMs;
    this.shuffle = shuffle;
    this.fetchImpl = fetchImpl;
    this.userAgent = userAgent?.trim() || undefined;
    this.sleep = sleep;
    this.random = random;
  }

  /**
   * Executes an Overpass QL query with shuffled failover across interpreters.
   * @param query Complete Overpass QL script.
   * @param signal Optional caller abort signal.
   * @param onAttempt Optional per-endpoint progress callback.
   */
  query(
    query: string,
    signal?: AbortSignal,
    onAttempt?: OverpassAttemptListener,
  ): Promise<OverpassResponse> {
    const order = this.shuffle(this.endpoints).slice(
      0,
      OVERPASS_MAX_ENDPOINT_ATTEMPTS,
    );
    return this.queryInOrder(order, 0, query, signal, onAttempt);
  }

  /**
   * Tries interpreters sequentially from `index` without awaiting inside a loop.
   * @param order Shuffled endpoint URLs for this query.
   * @param index Current attempt index.
   * @param query Overpass QL script.
   * @param signal Optional caller abort signal.
   * @param onAttempt Optional progress callback.
   * @param lastError Last retryable failure from a prior attempt.
   */
  private async queryInOrder(
    order: readonly string[],
    index: number,
    query: string,
    signal: AbortSignal | undefined,
    onAttempt: OverpassAttemptListener | undefined,
    lastError?: OverpassError,
  ): Promise<OverpassResponse> {
    if (index >= order.length) {
      throw (
        lastError ??
        new OverpassError("Could not reach the Overpass API. Try again.")
      );
    }

    const endpoint = order[index];
    const hostname = hostnameFromEndpoint(endpoint);
    onAttempt?.({ endpoint, hostname, index, status: "started" });

    const outcome = await this.attemptEndpoint(
      endpoint,
      hostname,
      index,
      query,
      signal,
      onAttempt,
    );

    if (outcome.kind === "success") {
      return outcome.response;
    }
    if (outcome.kind === "fatal") {
      throw outcome.error;
    }

    if (index + 1 >= order.length) {
      throw outcome.error;
    }

    // Space failover attempts so 429 / transient bursts do not hammer the next mirror.
    if (signal?.aborted) {
      throw abortError(signal);
    }
    await this.sleep(computeOverpassRetryDelayMs(index, this.random), signal);

    return this.queryInOrder(
      order,
      index + 1,
      query,
      signal,
      onAttempt,
      outcome.error,
    );
  }

  /**
   * Runs one interpreter attempt and classifies the outcome for failover.
   * @param endpoint Interpreter URL.
   * @param hostname Display hostname for progress events.
   * @param index Attempt index in this query’s order.
   * @param query Overpass QL script.
   * @param signal Optional caller abort signal.
   * @param onAttempt Optional progress callback.
   */
  private async attemptEndpoint(
    endpoint: string,
    hostname: string,
    index: number,
    query: string,
    signal: AbortSignal | undefined,
    onAttempt: OverpassAttemptListener | undefined,
  ): Promise<OverpassAttemptOutcome> {
    try {
      const response = await this.queryEndpoint(endpoint, query, signal);
      onAttempt?.({ endpoint, hostname, index, status: "succeeded" });
      return { kind: "success", response };
    } catch (error) {
      if (signal?.aborted) {
        return { error, kind: "fatal" };
      }

      if (error instanceof OverpassError && error.timedOut) {
        onAttempt?.({ endpoint, hostname, index, status: "timed_out" });
        return { error, kind: "retry" };
      }

      if (!isRetryableOverpassFailure(error)) {
        if (error instanceof OverpassError) {
          onAttempt?.({ endpoint, hostname, index, status: "failed" });
        }
        return { error, kind: "fatal" };
      }

      onAttempt?.({ endpoint, hostname, index, status: "failed" });
      const retryError =
        error instanceof OverpassError
          ? error
          : new OverpassError(
              "Could not reach the Overpass API. Check your network and try again.",
              { cause: error },
            );
      return { error: retryError, kind: "retry" };
    }
  }

  /**
   * POSTs one interpreter and parses the Overpass JSON body.
   * @param endpoint Interpreter URL.
   * @param query Overpass QL script.
   * @param signal Optional caller abort signal.
   */
  private async queryEndpoint(
    endpoint: string,
    query: string,
    signal?: AbortSignal,
  ): Promise<OverpassResponse> {
    const body = new URLSearchParams({ data: query });
    const timeout = createTimeoutSignal(this.timeoutMs);
    const combined = combineAbortSignals(signal, timeout.signal);
    let response: Response;
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      };
      if (this.userAgent) {
        headers["User-Agent"] = this.userAgent;
      }
      response = await this.fetchImpl(endpoint, {
        body,
        headers,
        method: "POST",
        signal: combined,
      });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      if (timeout.signal.aborted) {
        throw new OverpassError(overpassTimeoutMessage(), {
          cause: error,
          timedOut: true,
        });
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
    return parseOverpassResponseBody(text);
  }
}

/** Classified result of a single interpreter attempt. */
type OverpassAttemptOutcome =
  | { kind: "success"; response: OverpassResponse }
  | { kind: "retry"; error: OverpassError }
  | { kind: "fatal"; error: unknown };

/**
 * Delay before the next interpreter after a retryable failure.
 * @param retryIndex Zero-based failed attempt index (0 before 2nd try).
 * @param random Unit interval RNG for jitter; defaults to Math.random.
 */
export function computeOverpassRetryDelayMs(
  retryIndex: number,
  random: OverpassRandom = Math.random,
): number {
  const exponential = Math.min(
    OVERPASS_RETRY_MAX_MS,
    OVERPASS_RETRY_BASE_MS * 2 ** retryIndex,
  );
  const jitter = Math.floor(random() * OVERPASS_RETRY_BASE_MS);
  return exponential + jitter;
}

/**
 * True when the failure should advance to the next interpreter.
 * @param error Thrown value from a single endpoint attempt.
 */
export function isRetryableOverpassFailure(error: unknown): boolean {
  if (!(error instanceof OverpassError)) {
    return true;
  }
  if (error.timedOut) {
    return true;
  }
  const { status } = error;
  if (status === undefined) {
    // Network / reachability failures have no HTTP status.
    return true;
  }
  if (status === 429 || status === 408 || status === 406) {
    return true;
  }
  return status >= 500;
}

/**
 * Hostname for loader display from an interpreter URL.
 * @param endpoint Full interpreter URL.
 */
export function hostnameFromEndpoint(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return endpoint;
  }
}

/**
 * Returns a Fisher–Yates shuffled copy of the endpoint list.
 * @param endpoints Interpreter URLs to reorder.
 */
export function shuffleEndpoints(endpoints: readonly string[]): string[] {
  const next = [...endpoints];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }
  return next;
}

/**
 * Returns a user-facing message when the overall Places client budget is exhausted.
 */
export function overpassTimeoutMessage(): string {
  return `Query timed out after about ${OVERPASS_CLIENT_TIMEOUT_SECONDS}s. Narrow the area or filters.`;
}

/**
 * Maps Overpass JSON remarks to stable user-facing error copy.
 * Never returns raw interpreter text.
 * @param remark Optional remark from the Overpass JSON payload.
 */
export function describeOverpassRemark(remark?: string): string | undefined {
  if (!remark) {
    return;
  }
  const normalized = remark.toLowerCase();
  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return `Query timed out after about ${OVERPASS_TIMEOUT_SECONDS}s. Narrow the area or filters.`;
  }
  if (normalized.includes("memory")) {
    return "Query ran out of memory on the Overpass server. Narrow the area or filters.";
  }
  return "Overpass could not complete this query. Narrow the area or filters and try again.";
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

/**
 * Resolves after `ms`, or rejects early when `signal` aborts.
 * @param ms Delay in milliseconds.
 * @param signal Optional abort signal.
 */
export async function sleepWithAbort(
  ms: number,
  signal?: AbortSignal,
): Promise<void> {
  if (ms <= 0) {
    return;
  }
  if (signal?.aborted) {
    throw abortError(signal);
  }
  await new Promise<void>((resolve, reject) => {
    const timerId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timerId);
      signal?.removeEventListener("abort", onAbort);
      reject(abortError(signal));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Prefer `signal.reason` when present; otherwise a standard AbortError.
 * @param signal Aborted signal, or undefined when reason is unknown.
 */
function abortError(signal?: AbortSignal): unknown {
  if (signal?.reason !== undefined) {
    return signal.reason;
  }
  return new DOMException("The operation was aborted.", "AbortError");
}
